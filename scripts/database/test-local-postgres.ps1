[CmdletBinding()]
param(
  [string]$PostgresBin = "C:\Program Files\PostgreSQL\18\bin",
  [string]$HostName = "127.0.0.1",
  [int]$Port = 5432,
  [string]$AdminUser = "postgres"
)

$ErrorActionPreference = "Stop"
$testDatabase = "cardapio_digital_test"
$runtimeRole = "cardapio_runtime_test"
$psql = Join-Path $PostgresBin "psql.exe"
$createdb = Join-Path $PostgresBin "createdb.exe"
$dropdb = Join-Path $PostgresBin "dropdb.exe"
$repositoryRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$upMigration = Join-Path $repositoryRoot "database\migrations\0001_initial_schema.up.sql"
$downMigration = Join-Path $repositoryRoot "database\migrations\0001_initial_schema.down.sql"
$isolationTest = Join-Path $repositoryRoot "database\tests\multitenant-isolation.sql"

if (-not $env:PGPASSWORD) {
  $securePassword = Read-Host "Senha local do PostgreSQL" -AsSecureString
  $temporaryCredential = New-Object System.Management.Automation.PSCredential($AdminUser, $securePassword)
  $env:PGPASSWORD = $temporaryCredential.GetNetworkCredential().Password
}

foreach ($executable in @($psql, $createdb, $dropdb)) {
  if (-not (Test-Path -LiteralPath $executable)) {
    throw "Executável PostgreSQL não encontrado: $executable"
  }
}

function Invoke-PsqlAdmin([string[]]$Arguments) {
  & $psql -X -w -v ON_ERROR_STOP=1 -h $HostName -p $Port -U $AdminUser -d postgres @Arguments
  if ($LASTEXITCODE -ne 0) { throw "psql administrativo falhou." }
}

function Invoke-PsqlTestDatabase([string[]]$Arguments) {
  & $psql -X -w -v ON_ERROR_STOP=1 -h $HostName -p $Port -U $AdminUser -d $testDatabase @Arguments
  if ($LASTEXITCODE -ne 0) { throw "psql no banco descartável falhou." }
}

$createdDatabase = $false
$createdRole = $false
try {
  $databaseExists = (& $psql -X -w -At -h $HostName -p $Port -U $AdminUser -d postgres -c "SELECT 1 FROM pg_database WHERE datname = '$testDatabase';")
  if ($LASTEXITCODE -ne 0) { throw "Não foi possível verificar o banco descartável." }
  if ($databaseExists -eq "1") {
    throw "O banco $testDatabase já existe. Remova-o conscientemente antes do teste para evitar sobrescrever dados."
  }

  $roleExists = (& $psql -X -w -At -h $HostName -p $Port -U $AdminUser -d postgres -c "SELECT 1 FROM pg_roles WHERE rolname = '$runtimeRole';")
  if ($LASTEXITCODE -ne 0) { throw "Não foi possível verificar o papel de teste." }
  if ($roleExists -eq "1") {
    throw "O papel $runtimeRole já existe. Remova-o conscientemente antes do teste."
  }

  Invoke-PsqlAdmin -Arguments @("-c", "CREATE ROLE $runtimeRole NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;")
  $createdRole = $true
  & $createdb -w -h $HostName -p $Port -U $AdminUser $testDatabase
  if ($LASTEXITCODE -ne 0) { throw "Falha ao criar o banco descartável." }
  $createdDatabase = $true

  Invoke-PsqlTestDatabase -Arguments @("-f", $upMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $isolationTest)
  Invoke-PsqlTestDatabase -Arguments @("-f", $downMigration)

  $remainingTables = (& $psql -X -w -At -h $HostName -p $Port -U $AdminUser -d $testDatabase -c "SELECT count(*) FROM pg_tables WHERE schemaname = 'public';")
  if ($LASTEXITCODE -ne 0 -or $remainingTables -ne "0") {
    throw "Rollback deixou tabelas no schema public."
  }

  Invoke-PsqlTestDatabase -Arguments @("-f", $upMigration)
  Write-Host "PostgreSQL local validado: up, RLS, isolamento, snapshots, down e novo up."
}
finally {
  if ($createdDatabase) {
    & $dropdb -w --if-exists --force -h $HostName -p $Port -U $AdminUser $testDatabase
  }
  if ($createdRole) {
    Invoke-PsqlAdmin -Arguments @("-c", "DROP ROLE IF EXISTS $runtimeRole;")
  }
  Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
  $temporaryCredential = $null
  $securePassword = $null
}

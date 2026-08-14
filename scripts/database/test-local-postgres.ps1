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
$repositoryUpMigration = Join-Path $repositoryRoot "database\migrations\0002_catalog_repository.up.sql"
$repositoryDownMigration = Join-Path $repositoryRoot "database\migrations\0002_catalog_repository.down.sql"
$isolationTest = Join-Path $repositoryRoot "database\tests\multitenant-isolation.sql"
$repositoryFixture = Join-Path $repositoryRoot "database\tests\catalog-repository-fixture.sql"

if (-not $env:PGPASSWORD) {
  $securePassword = Read-Host "Senha local do PostgreSQL" -AsSecureString
  $temporaryCredential = New-Object System.Management.Automation.PSCredential($AdminUser, $securePassword)
  $env:PGPASSWORD = $temporaryCredential.GetNetworkCredential().Password
}
$previousPgClientEncoding = $env:PGCLIENTENCODING
$env:PGCLIENTENCODING = "UTF8"

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

  $runtimePasswordBytes = New-Object byte[] 32
  $passwordGenerator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $passwordGenerator.GetBytes($runtimePasswordBytes)
  }
  finally {
    $passwordGenerator.Dispose()
  }
  $runtimePassword = [Convert]::ToBase64String($runtimePasswordBytes)
  Invoke-PsqlAdmin -Arguments @("-c", "CREATE ROLE $runtimeRole LOGIN PASSWORD '$runtimePassword' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;")
  $createdRole = $true
  & $createdb -w -h $HostName -p $Port -U $AdminUser $testDatabase
  if ($LASTEXITCODE -ne 0) { throw "Falha ao criar o banco descartável." }
  $createdDatabase = $true

  Invoke-PsqlTestDatabase -Arguments @("-f", $upMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $repositoryUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $isolationTest)
  Invoke-PsqlTestDatabase -Arguments @("-f", $repositoryFixture)

  $encodedRuntimePassword = [Uri]::EscapeDataString($runtimePassword)
  $env:DATABASE_TEST_URL = "postgresql://${runtimeRole}:${encodedRuntimePassword}@${HostName}:${Port}/${testDatabase}"
  Push-Location $repositoryRoot
  try {
    & npm.cmd run test:database
    if ($LASTEXITCODE -ne 0) { throw "Teste de integração do repositório falhou." }
  }
  finally {
    Pop-Location
    Remove-Item Env:\DATABASE_TEST_URL -ErrorAction SilentlyContinue
  }

  Invoke-PsqlTestDatabase -Arguments @("-f", $repositoryDownMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $downMigration)

  $remainingTables = (& $psql -X -w -At -h $HostName -p $Port -U $AdminUser -d $testDatabase -c "SELECT count(*) FROM pg_tables WHERE schemaname = 'public';")
  if ($LASTEXITCODE -ne 0 -or $remainingTables -ne "0") {
    throw "Rollback deixou tabelas no schema public."
  }

  Invoke-PsqlTestDatabase -Arguments @("-f", $upMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $repositoryUpMigration)
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
  $runtimePassword = $null
  $runtimePasswordBytes = $null
  $passwordGenerator = $null
  Remove-Item Env:\DATABASE_TEST_URL -ErrorAction SilentlyContinue
  if ($null -eq $previousPgClientEncoding) {
    Remove-Item Env:\PGCLIENTENCODING -ErrorAction SilentlyContinue
  }
  else {
    $env:PGCLIENTENCODING = $previousPgClientEncoding
  }
}

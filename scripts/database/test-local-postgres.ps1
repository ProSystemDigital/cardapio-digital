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
$writesUpMigration = Join-Path $repositoryRoot "database\migrations\0003_catalog_writes.up.sql"
$writesDownMigration = Join-Path $repositoryRoot "database\migrations\0003_catalog_writes.down.sql"
$authorizationUpMigration = Join-Path $repositoryRoot "database\migrations\0004_identity_authorization.up.sql"
$authorizationDownMigration = Join-Path $repositoryRoot "database\migrations\0004_identity_authorization.down.sql"
$identityLinksUpMigration = Join-Path $repositoryRoot "database\migrations\0005_external_identity_links.up.sql"
$identityLinksDownMigration = Join-Path $repositoryRoot "database\migrations\0005_external_identity_links.down.sql"
$principalTenantAccessUpMigration = Join-Path $repositoryRoot "database\migrations\0006_principal_tenant_access.up.sql"
$principalTenantAccessDownMigration = Join-Path $repositoryRoot "database\migrations\0006_principal_tenant_access.down.sql"
$tenantProfileWritesUpMigration = Join-Path $repositoryRoot "database\migrations\0007_tenant_profile_writes.up.sql"
$tenantProfileWritesDownMigration = Join-Path $repositoryRoot "database\migrations\0007_tenant_profile_writes.down.sql"
$categoryWritesUpMigration = Join-Path $repositoryRoot "database\migrations\0008_category_writes.up.sql"
$categoryWritesDownMigration = Join-Path $repositoryRoot "database\migrations\0008_category_writes.down.sql"
$categoryCreationUpMigration = Join-Path $repositoryRoot "database\migrations\0009_category_creation.up.sql"
$categoryCreationDownMigration = Join-Path $repositoryRoot "database\migrations\0009_category_creation.down.sql"
$tenantFulfillmentUpMigration = Join-Path $repositoryRoot "database\migrations\0010_tenant_fulfillment_activation.up.sql"
$tenantFulfillmentDownMigration = Join-Path $repositoryRoot "database\migrations\0010_tenant_fulfillment_activation.down.sql"
$catalogImageMetadataUpMigration = Join-Path $repositoryRoot "database\migrations\0011_catalog_image_metadata.up.sql"
$catalogImageMetadataDownMigration = Join-Path $repositoryRoot "database\migrations\0011_catalog_image_metadata.down.sql"
$catalogImageAuditUpMigration = Join-Path $repositoryRoot "database\migrations\0012_catalog_image_audit_actions.up.sql"
$catalogImageAuditDownMigration = Join-Path $repositoryRoot "database\migrations\0012_catalog_image_audit_actions.down.sql"
$tenantOperationsUpMigration = Join-Path $repositoryRoot "database\migrations\0013_tenant_operations_writes.up.sql"
$tenantOperationsDownMigration = Join-Path $repositoryRoot "database\migrations\0013_tenant_operations_writes.down.sql"
$deliveryDistanceUpMigration = Join-Path $repositoryRoot "database\migrations\0014_delivery_distance.up.sql"
$deliveryDistanceDownMigration = Join-Path $repositoryRoot "database\migrations\0014_delivery_distance.down.sql"
$deliveryOriginUpMigration = Join-Path $repositoryRoot "database\migrations\0015_tenant_delivery_origin.up.sql"
$deliveryOriginDownMigration = Join-Path $repositoryRoot "database\migrations\0015_tenant_delivery_origin.down.sql"
$tenantPrivacyUpMigration = Join-Path $repositoryRoot "database\migrations\0016_tenant_privacy_settings.up.sql"
$tenantPrivacyDownMigration = Join-Path $repositoryRoot "database\migrations\0016_tenant_privacy_settings.down.sql"
$productCreationUpMigration = Join-Path $repositoryRoot "database\migrations\0017_product_creation.up.sql"
$productCreationDownMigration = Join-Path $repositoryRoot "database\migrations\0017_product_creation.down.sql"
$productArchivingUpMigration = Join-Path $repositoryRoot "database\migrations\0018_product_archiving.up.sql"
$productArchivingDownMigration = Join-Path $repositoryRoot "database\migrations\0018_product_archiving.down.sql"
$categoryArchivingUpMigration = Join-Path $repositoryRoot "database\migrations\0019_category_archiving.up.sql"
$categoryArchivingDownMigration = Join-Path $repositoryRoot "database\migrations\0019_category_archiving.down.sql"
$diningTablesUpMigration = Join-Path $repositoryRoot "database\migrations\0022_dining_tables.up.sql"
$diningTablesDownMigration = Join-Path $repositoryRoot "database\migrations\0022_dining_tables.down.sql"
$isolationTest = Join-Path $repositoryRoot "database\tests\multitenant-isolation.sql"
$repositoryFixture = Join-Path $repositoryRoot "database\tests\catalog-repository-fixture.sql"
$authorizationFixture = Join-Path $repositoryRoot "database\tests\authorization-fixture.sql"
$identityLinksFixture = Join-Path $repositoryRoot "database\tests\external-identity-fixture.sql"
$tenantProfileCommandFixture = Join-Path $repositoryRoot "database\tests\tenant-profile-command-fixture.sql"
$categoryCommandFixture = Join-Path $repositoryRoot "database\tests\category-command-fixture.sql"
$categoryCreationCleanup = Join-Path $repositoryRoot "database\tests\category-creation-cleanup.sql"
$tenantFulfillmentFixture = Join-Path $repositoryRoot "database\tests\tenant-fulfillment-command-fixture.sql"
$tenantFulfillmentCleanup = Join-Path $repositoryRoot "database\tests\tenant-fulfillment-cleanup.sql"
$catalogImageMetadataIsolation = Join-Path $repositoryRoot "database\tests\catalog-image-metadata-isolation.sql"
$catalogImageCommandFixture = Join-Path $repositoryRoot "database\tests\catalog-image-command-fixture.sql"
$catalogImageCleanup = Join-Path $repositoryRoot "database\tests\catalog-image-cleanup.sql"

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
  if ($LASTEXITCODE -ne 0) {
    $safeTarget = if ($Arguments.Count -ge 2 -and $Arguments[0] -eq "-f") {
      Split-Path -Leaf $Arguments[1]
    }
    else {
      "comando SQL controlado"
    }
    throw "psql no banco descartável falhou ao executar: $safeTarget."
  }
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
  Invoke-PsqlTestDatabase -Arguments @("-f", $writesUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $authorizationUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $identityLinksUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $principalTenantAccessUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $isolationTest)
  Invoke-PsqlTestDatabase -Arguments @("-f", $tenantProfileWritesUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $categoryWritesUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $categoryCreationUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $tenantFulfillmentUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $catalogImageMetadataUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $catalogImageAuditUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $catalogImageMetadataIsolation)
  Invoke-PsqlTestDatabase -Arguments @("-f", $catalogImageCommandFixture)
  Invoke-PsqlTestDatabase -Arguments @("-f", $repositoryFixture)
  Invoke-PsqlTestDatabase -Arguments @("-f", $tenantOperationsUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $deliveryDistanceUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $deliveryOriginUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $tenantPrivacyUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $productCreationUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $productArchivingUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $categoryArchivingUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $diningTablesUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-c", "GRANT INSERT (tenant_id, id, category_id, slug, name, description, base_price_in_cents, is_available) ON products TO $runtimeRole; GRANT INSERT ON product_fulfillment_modes, catalog_audit_events TO $runtimeRole;")
  Invoke-PsqlTestDatabase -Arguments @("-c", "GRANT UPDATE (archived_at, is_available, version, updated_at) ON products TO $runtimeRole;")
  Invoke-PsqlTestDatabase -Arguments @("-c", "GRANT UPDATE (archived_at, version, updated_at) ON categories TO $runtimeRole;")
  Invoke-PsqlTestDatabase -Arguments @("-c", "GRANT SELECT, INSERT, UPDATE ON tenant_delivery_origins, tenant_privacy_settings TO $runtimeRole; GRANT SELECT, INSERT ON tenant_delivery_origin_audit_events, tenant_privacy_audit_events TO $runtimeRole;")
  Invoke-PsqlTestDatabase -Arguments @("-c", "GRANT SELECT, INSERT, DELETE ON tenant_payment_methods, business_hours TO $runtimeRole; GRANT UPDATE (minimum_order_in_cents, delivery_fee_in_cents, whatsapp_number, maximum_delivery_distance_in_meters, dining_table_labels, version, updated_at) ON tenant_operations TO $runtimeRole; GRANT SELECT, INSERT ON tenant_operations_audit_events TO $runtimeRole;")
  Invoke-PsqlTestDatabase -Arguments @("-f", $authorizationFixture)
  Invoke-PsqlTestDatabase -Arguments @("-f", $identityLinksFixture)
  Invoke-PsqlTestDatabase -Arguments @("-f", $tenantProfileCommandFixture)
  Invoke-PsqlTestDatabase -Arguments @("-f", $categoryCommandFixture)
  Invoke-PsqlTestDatabase -Arguments @("-f", $tenantFulfillmentFixture)

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

  Invoke-PsqlTestDatabase -Arguments @("-f", $categoryCreationCleanup)
  Invoke-PsqlTestDatabase -Arguments @("-f", $tenantFulfillmentCleanup)
  Invoke-PsqlTestDatabase -Arguments @("-f", $catalogImageCleanup)
  Invoke-PsqlTestDatabase -Arguments @("-c", "DELETE FROM tenant_delivery_origin_audit_events; DELETE FROM tenant_privacy_audit_events; DELETE FROM tenant_delivery_origins; DELETE FROM tenant_privacy_settings; DELETE FROM tenant_operations_audit_events; DELETE FROM tenant_payment_methods;")
  Invoke-PsqlTestDatabase -Arguments @("-c", "DELETE FROM catalog_audit_events WHERE action = 'product.created'; DELETE FROM product_fulfillment_modes WHERE product_id IN (SELECT id FROM products WHERE name = 'Produto novo auditado'); DELETE FROM products WHERE name = 'Produto novo auditado';")

  Invoke-PsqlTestDatabase -Arguments @("-f", $categoryArchivingDownMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $diningTablesDownMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $productArchivingDownMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $productCreationDownMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $deliveryOriginDownMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $tenantPrivacyDownMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $deliveryDistanceDownMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $tenantOperationsDownMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $catalogImageAuditDownMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $catalogImageMetadataDownMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $tenantFulfillmentDownMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $categoryCreationDownMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $categoryWritesDownMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $tenantProfileWritesDownMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $principalTenantAccessDownMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $identityLinksDownMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $authorizationDownMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $writesDownMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $repositoryDownMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $downMigration)

  $remainingTables = (& $psql -X -w -At -h $HostName -p $Port -U $AdminUser -d $testDatabase -c "SELECT count(*) FROM pg_tables WHERE schemaname = 'public';")
  if ($LASTEXITCODE -ne 0 -or $remainingTables -ne "0") {
    throw "Rollback deixou tabelas no schema public."
  }

  Invoke-PsqlTestDatabase -Arguments @("-f", $upMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $repositoryUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $writesUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $authorizationUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $identityLinksUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $principalTenantAccessUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $tenantProfileWritesUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $categoryWritesUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $categoryCreationUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $tenantFulfillmentUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $catalogImageMetadataUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $catalogImageAuditUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $tenantOperationsUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $deliveryDistanceUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $deliveryOriginUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $tenantPrivacyUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $productCreationUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $productArchivingUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $categoryArchivingUpMigration)
  Invoke-PsqlTestDatabase -Arguments @("-f", $diningTablesUpMigration)
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

[CmdletBinding()]
param(
  [ValidateSet("Provision", "Revoke", "Activate", "Upgrade", "EnableCatalogRead", "EnableCatalogAvailabilityWrite", "EnableCatalogPriceWrite", "EnableCatalogAuditRead", "EnableCatalogContentWrite")]
  [string]$Action = "Provision",
  [string]$HostName = "127.0.0.1",
  [int]$Port = 5432,
  [string]$AdminUser = "postgres"
)

$ErrorActionPreference = "Stop"
$repositoryRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$executor = Join-Path $PSScriptRoot "manage-local-admin-link.mjs"

if (-not (Test-Path -LiteralPath $executor -PathType Leaf)) {
  throw "Executor de provisionamento não encontrado."
}

$securePassword = Read-Host "Senha local do PostgreSQL" -AsSecureString
$temporaryCredential = New-Object System.Management.Automation.PSCredential(
  $AdminUser,
  $securePassword
)

try {
  $env:CARDAPIO_DB_ADMIN_PASSWORD = $temporaryCredential.GetNetworkCredential().Password
  $env:CARDAPIO_DB_ADMIN_USER = $AdminUser
  $env:CARDAPIO_DB_HOST = $HostName
  $env:CARDAPIO_DB_PORT = $Port.ToString()
  $env:CARDAPIO_LOCAL_ADMIN_ACTION = $Action.ToLowerInvariant()

  Push-Location $repositoryRoot
  try {
    & node $executor
    if ($LASTEXITCODE -ne 0) {
      throw "Provisionamento local falhou sem alterar credenciais versionadas."
    }
  }
  finally {
    Pop-Location
  }
}
finally {
  Remove-Item Env:\CARDAPIO_DB_ADMIN_PASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:\CARDAPIO_DB_ADMIN_USER -ErrorAction SilentlyContinue
  Remove-Item Env:\CARDAPIO_DB_HOST -ErrorAction SilentlyContinue
  Remove-Item Env:\CARDAPIO_DB_PORT -ErrorAction SilentlyContinue
  Remove-Item Env:\CARDAPIO_LOCAL_ADMIN_ACTION -ErrorAction SilentlyContinue
  $temporaryCredential = $null
  $securePassword = $null
}

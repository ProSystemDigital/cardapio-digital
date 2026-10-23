[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$repositoryRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$environmentPath = Join-Path $repositoryRoot ".env.local"

if (-not (Get-Command stripe -ErrorAction SilentlyContinue)) {
  throw "Stripe CLI não encontrada no PATH."
}

if (-not (Test-Path -LiteralPath $environmentPath -PathType Leaf)) {
  throw ".env.local não encontrado."
}

$contents = [System.IO.File]::ReadAllText($environmentPath)
$stripeSecretKeyMatch = [regex]::Match(
  $contents,
  '(?m)^\s*STRIPE_SECRET_KEY\s*=\s*(?<value>\S+)\s*$'
)
if (-not $stripeSecretKeyMatch.Success) {
  throw "STRIPE_SECRET_KEY não encontrada em .env.local."
}

$stripeSecretKey = $stripeSecretKeyMatch.Groups['value'].Value.Trim().Trim('"').Trim("'")
if ($stripeSecretKey -notmatch '^sk_test_[A-Za-z0-9_]+$') {
  throw "A configuração local deve usar uma chave secreta Stripe de teste."
}

$webhookSecret = (& stripe listen --api-key $stripeSecretKey --print-secret 2>$null).Trim()
if ($LASTEXITCODE -ne 0 -or $webhookSecret -notmatch '^whsec_[A-Za-z0-9]+$') {
  throw "Não foi possível obter um segredo de webhook sandbox válido."
}

$line = "STRIPE_WEBHOOK_SECRET=$webhookSecret"
if ($contents -match '(?m)^\s*STRIPE_WEBHOOK_SECRET\s*=.*$') {
  $contents = [regex]::Replace(
    $contents,
    '(?m)^\s*STRIPE_WEBHOOK_SECRET\s*=.*$',
    $line
  )
}
else {
  $contents = $contents.TrimEnd() + [Environment]::NewLine + $line + [Environment]::NewLine
}

$utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($environmentPath, $contents, $utf8WithoutBom)
$webhookSecret = $null
$stripeSecretKey = $null

Write-Host "Segredo sandbox do webhook configurado em .env.local."

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

$events = @(
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'invoice.paid',
  'invoice.payment_failed',
  'customer.subscription.updated',
  'customer.subscription.deleted'
) -join ','

Write-Host "Encaminhando eventos do sandbox configurado no aplicativo. Pressione Ctrl+C para encerrar."
& stripe listen `
  --api-key $stripeSecretKey `
  --events $events `
  --forward-to 'http://localhost:3000/api/stripe/webhook'

$stripeSecretKey = $null

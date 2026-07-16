# Deploy the Constitutional DAO to GenLayer
# Usage (from repo root): pwsh ./deploy/deploy.ps1

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

function Invoke-GL {
    param([Parameter(ValueFromRemainingArguments = $true)] $GLArgs)
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & genlayer @GLArgs 2>&1 | Out-Host
    $code = $LASTEXITCODE
    $ErrorActionPreference = $prev
    if ($code -ne 0) { throw "genlayer $($GLArgs -join ' ') failed (exit $code)" }
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$contract = Join-Path $repoRoot "contracts/dao.py"

Write-Host "Deploying DAO Intelligent Contract..."
Invoke-GL deploy $contract

Write-Host "Deployment completed. Please copy the contract address to your .env or localStorage."

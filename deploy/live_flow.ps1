# Live flow test script for GenLayer-DAO-app
# Simulates creating a compliant proposal and a non-compliant proposal

Write-Host "Please enter the contract address:"
$address = Read-Host

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

Write-Host "Funding treasury..."
Invoke-GL write $address fund_treasury --value 1000

Write-Host "Creating COMPLIANT proposal..."
# Title/Desc is packed in string
$compliantDesc = "Compliant Proposal`n---`nWe need 100 atto to fund an open-source library.`n---`nFunds: 100"
Invoke-GL write $address create_proposal "prop-compliant-1" $compliantDesc 100

Write-Host "Creating NON-COMPLIANT (Scam/Phishing) proposal..."
$scamDesc = "Fake Proposal`n---`nWe need 100 atto to send to this random address for a Ponzi scheme.`n---`nFunds: 100"
Invoke-GL write $address create_proposal "prop-scam-1" $scamDesc 100

Write-Host "Done. Check the contract state to ensure the scam proposal was flagged/rejected and the compliant one is pending!"

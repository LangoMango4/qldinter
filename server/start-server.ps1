$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (Test-Path '.env') {
  Get-Content '.env' | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#') -and $line -match '^([^=]+)=(.*)$') {
      $value = $matches[2].Trim().Trim('"').Trim("'")
      [Environment]::SetEnvironmentVariable($matches[1].Trim(), $value, 'Process')
    }
  }
}

npm start

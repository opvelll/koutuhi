$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $repoRoot

$buildVenv = Join-Path $repoRoot '.venv-build'
$buildPython = Join-Path $buildVenv 'Scripts\python.exe'
$buildPyInstaller = Join-Path $buildVenv 'Scripts\pyinstaller.exe'

if (Test-Path -LiteralPath $buildVenv) {
    Remove-Item -LiteralPath $buildVenv -Recurse -Force
}

uv venv $buildVenv --python 3.12
uv pip install --python $buildPython -r requirements.txt "pyinstaller>=6,<7"

& $buildPyInstaller --clean --noconfirm packaging\koutuhi.spec
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

$artifactDir = Join-Path $repoRoot 'artifacts'
$distDir = Join-Path $repoRoot 'dist\koutuhi'
$zipPath = Join-Path $artifactDir 'koutuhi-windows.zip'
$distSettingDir = Join-Path $distDir 'setting'

New-Item -ItemType Directory -Force -Path $artifactDir | Out-Null
if (Test-Path -LiteralPath $distSettingDir) {
    Remove-Item -LiteralPath $distSettingDir -Recurse -Force
}
Copy-Item -LiteralPath (Join-Path $repoRoot 'setting') -Destination $distSettingDir -Recurse

if (Test-Path -LiteralPath $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive -Path (Join-Path $distDir '*') -DestinationPath $zipPath
Write-Host "Created $zipPath"

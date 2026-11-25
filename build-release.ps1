# Build downloadable archives from the exact commit that the release tag identifies.
[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string] $Destination,
    [string] $Revision = 'HEAD'
)

$ErrorActionPreference = 'Stop'
$target = [IO.Directory]::CreateDirectory($Destination).FullName
$commit = git -C $PSScriptRoot rev-parse --verify --end-of-options "${Revision}^{commit}"
if ($LASTEXITCODE -ne 0) { throw "Unknown release revision $Revision" }

$timestamp = git -C $PSScriptRoot show -s --format=%cI $commit

function Export-Archive([string] $Name, [string] $Tree, [string] $Prefix) {
    $output = Join-Path $target $Name
    git -c core.autocrlf=false -c core.eol=lf -C $PSScriptRoot archive --format=zip "--mtime=$timestamp" "--prefix=$Prefix" "--output=$output" $Tree
    if ($LASTEXITCODE -ne 0) { throw "Could not archive $Tree" }
    $hash = (Get-FileHash -LiteralPath $output -Algorithm SHA256).Hash.ToLowerInvariant()
    "$hash  $Name"
}

$skills = git -C $PSScriptRoot ls-tree -d --name-only "${commit}:skills"
if ($LASTEXITCODE -ne 0 -or !$skills) { throw 'No skills found at the release revision.' }
$checksums = @(
    Export-Archive 'shaughv-tasks.zip' $commit ''
    foreach ($skill in $skills) {
        Export-Archive "$skill.skill" "${commit}:skills/$skill" "$skill/"
    }
)
[IO.File]::WriteAllText((Join-Path $target 'SHA256SUMS.txt'), ($checksums -join "`n") + "`n")
Write-Host "Built $($checksums.Count) archives from $commit in $target"

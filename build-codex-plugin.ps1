<#
.SYNOPSIS
    Synchronize the tracked Codex plugin package at plugins/shaughv-tasks/.

.DESCRIPTION
    Codex installs a marketplace plugin by snapshotting the plugin source
    directory named by .agents/plugins/marketplace.json. That source must be a
    subdirectory of the marketplace root and must be self-contained — Codex
    cannot consume this repo's flat root (which must stay flat for Claude Code's
    install).

    Claude Code still consumes this repo from the root, so root skills/ and root
    .codex-plugin/plugin.json remain the authoring source of truth. This script
    regenerates the tracked package that Codex snapshots from Git:

        plugins/shaughv-tasks/
        |-- .codex-plugin/plugin.json   (copied verbatim from root)
        \-- skills/...                  (copied verbatim from root skills/)

    This bundle ships NO MCP servers (the task board is a local Node HTTP server
    the tasks-start skill launches, not an MCP server), so unlike shaughv-code
    there is no .mcp.json to wrap — the package is just the Codex manifest copied
    verbatim plus skills/ copied verbatim.

    Run without switches to regenerate the tracked package after root content
    changes. Run with -Check (validation/CI) to prove the tracked package is
    already in sync: it rebuilds into a temp dir and compares by hash, without
    modifying the worktree.

    NEVER hand-edit plugins/shaughv-tasks/ — it is generated. Edit root content
    (skills/, .codex-plugin/plugin.json) and re-run this script.
#>

[CmdletBinding()]
param(
    [switch] $Check
)

$ErrorActionPreference = 'Stop'

trap {
    Write-Host "FAILED: $_" -ForegroundColor Red
    exit 1
}

$repoRoot  = $PSScriptRoot
$mirror    = Join-Path $repoRoot 'plugins\shaughv-tasks'
$srcSkills = Join-Path $repoRoot 'skills'
$srcManif  = Join-Path $repoRoot '.codex-plugin\plugin.json'

# --- Windows MAX_PATH safety ---------------------------------------------------
# On install, Codex clones the whole marketplace repo; on Windows git's working-
# tree checkout aborts on long paths (~260 chars; git ignores core.longpaths
# unless it is explicitly set, which it is not by default). This repo's longest
# packaged path is well under the limit, so no filename shortening is needed —
# but the guard below measures the repo-relative path (plugins/shaughv-tasks/...)
# that git checks out and fails the build if a future addition gets dangerously
# long, leaving headroom for a teammate's clone-root prefix.
$MaxPathWarn = 170
$MaxPathFail = 200

foreach ($required in @($srcSkills, $srcManif)) {
    if (-not (Test-Path -LiteralPath $required)) {
        throw "Missing required source: $required"
    }
}

function Get-FullPath {
    param([Parameter(Mandatory)] [string] $Path)
    return [System.IO.Path]::GetFullPath($Path)
}

function Get-RelativePath {
    param(
        [Parameter(Mandatory)] [string] $Base,
        [Parameter(Mandatory)] [string] $Path
    )
    $baseUri = [System.Uri]((Get-FullPath $Base).TrimEnd('\', '/') + '\')
    $pathUri = [System.Uri](Get-FullPath $Path)
    return [System.Uri]::UnescapeDataString(
        $baseUri.MakeRelativeUri($pathUri).ToString()
    ) -replace '/', '\'
}

function Assert-MirrorPath {
    $repoFull = (Get-FullPath $repoRoot).TrimEnd('\', '/')
    $mirrorFull = (Get-FullPath $mirror).TrimEnd('\', '/')
    $expectedSuffix = 'plugins\shaughv-tasks'
    if (-not $mirrorFull.StartsWith($repoFull + '\', [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to touch mirror outside repo: $mirrorFull"
    }
    if (-not $mirrorFull.EndsWith($expectedSuffix, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to touch unexpected mirror path: $mirrorFull"
    }
}

function Build-Package {
    param([Parameter(Mandatory)] [string] $Destination)

    if (Test-Path -LiteralPath $Destination) {
        Remove-Item -LiteralPath $Destination -Recurse -Force
    }
    New-Item -ItemType Directory -Force -Path (Join-Path $Destination '.codex-plugin') | Out-Null
    Copy-Item -LiteralPath $srcManif -Destination (Join-Path $Destination '.codex-plugin\plugin.json')

    # Copy skills verbatim, file-by-file (preserves bytes and structure).
    $skillFiles = Get-ChildItem -LiteralPath $srcSkills -Recurse -File -Force
    foreach ($file in $skillFiles) {
        $rel      = Get-RelativePath -Base $srcSkills -Path $file.FullName
        $destPath = Join-Path $Destination (Join-Path 'skills' $rel)
        $destDir  = [System.IO.Path]::GetDirectoryName($destPath)
        if (-not (Test-Path -LiteralPath $destDir)) {
            New-Item -ItemType Directory -Force -Path $destDir | Out-Null
        }
        Copy-Item -LiteralPath $file.FullName -Destination $destPath
    }

    # Max-path guard: every packaged file's repo-relative path (what git checks
    # out on clone) must stay safely under the Windows limit.
    $offenders = [System.Collections.Generic.List[string]]::new()
    $warnings  = [System.Collections.Generic.List[string]]::new()
    $maxLen = 0
    Get-ChildItem -LiteralPath $Destination -Recurse -File -Force | ForEach-Object {
        $relToDest = (Get-RelativePath -Base $Destination -Path $_.FullName) -replace '\\', '/'
        $repoRel   = 'plugins/shaughv-tasks/' + $relToDest
        $len = $repoRel.Length
        if ($len -gt $maxLen) { $maxLen = $len }
        if ($len -ge $MaxPathFail) { $offenders.Add(("{0}  {1}" -f $len, $repoRel)) }
        elseif ($len -ge $MaxPathWarn) { $warnings.Add(("{0}  {1}" -f $len, $repoRel)) }
    }
    if ($warnings.Count -gt 0) {
        Write-Host "Path-length WARNING (>= $MaxPathWarn chars, approaching the Windows clone limit):" -ForegroundColor Yellow
        $warnings | Sort-Object -Descending | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
    }
    if ($offenders.Count -gt 0) {
        $msg = "Packaged path(s) exceed the Windows clone limit (>= $MaxPathFail chars):" + [Environment]::NewLine
        $msg += (($offenders | Sort-Object -Descending) -join [Environment]::NewLine)
        $msg += [Environment]::NewLine + 'Shorten the offending root filename under skills/ (root and package share names here).'
        throw $msg
    }

    return [pscustomobject]@{ MaxPath = $maxLen }
}

function Get-FileMap {
    param([Parameter(Mandatory)] [string] $Root)
    return @(Get-ChildItem -LiteralPath $Root -Recurse -File -Force |
        Sort-Object FullName |
        ForEach-Object {
            [pscustomobject]@{
                Path     = $_.FullName
                Relative = Get-RelativePath -Base $Root -Path $_.FullName
            }
        })
}

function Compare-Trees {
    param(
        [Parameter(Mandatory)] [string] $Expected,
        [Parameter(Mandatory)] [string] $Actual
    )
    $exp = Get-FileMap -Root $Expected
    $act = Get-FileMap -Root $Actual
    $expByPath = @{}; foreach ($f in $exp) { $expByPath[$f.Relative] = $f }
    $actByPath = @{}; foreach ($f in $act) { $actByPath[$f.Relative] = $f }

    $issues = [System.Collections.Generic.List[string]]::new()
    foreach ($rel in ($expByPath.Keys | Sort-Object)) {
        if (-not $actByPath.ContainsKey($rel)) { $issues.Add("missing: $rel"); continue }
        $h1 = (Get-FileHash -LiteralPath $expByPath[$rel].Path -Algorithm SHA256).Hash
        $h2 = (Get-FileHash -LiteralPath $actByPath[$rel].Path -Algorithm SHA256).Hash
        if ($h1 -ne $h2) { $issues.Add("hash mismatch: $rel") }
    }
    foreach ($rel in ($actByPath.Keys | Sort-Object)) {
        if (-not $expByPath.ContainsKey($rel)) { $issues.Add("extra: $rel") }
    }
    return $issues
}

Assert-MirrorPath

if ($Check) {
    if (-not (Test-Path -LiteralPath $mirror -PathType Container)) {
        throw "Codex plugin package does not exist: $mirror  (run: pwsh ./build-codex-plugin.ps1)"
    }
    $temp = Join-Path ([System.IO.Path]::GetTempPath()) ("codex-pkg-check-" + [System.Guid]::NewGuid().ToString('N'))
    try {
        $result = Build-Package -Destination $temp
        $issues = Compare-Trees -Expected $temp -Actual $mirror

        $srcVersion = (Get-Content -LiteralPath $srcManif -Raw | ConvertFrom-Json).version
        $dstVersion = (Get-Content -LiteralPath (Join-Path $mirror '.codex-plugin\plugin.json') -Raw | ConvertFrom-Json).version
        if ($srcVersion -ne $dstVersion) { $issues.Add("version mismatch: source $srcVersion != package $dstVersion") }

        if ($issues.Count -gt 0) {
            $preview = ($issues | Select-Object -First 25) -join [Environment]::NewLine
            $suffix = if ($issues.Count -gt 25) { [Environment]::NewLine + "...and $($issues.Count - 25) more issue(s)" } else { '' }
            throw "Codex plugin package is out of sync (run: pwsh ./build-codex-plugin.ps1 and commit):$([Environment]::NewLine)$preview$suffix"
        }

        $skills = (Get-ChildItem -LiteralPath (Join-Path $mirror 'skills') -Directory).Count
        $files  = (Get-ChildItem -LiteralPath $mirror -Recurse -File -Force).Count
        Write-Host "Codex plugin package checked: $mirror" -ForegroundColor Green
        Write-Host "  version : $srcVersion"
        Write-Host "  skills  : $skills directories"
        Write-Host "  files   : $files"
        Write-Host "  maxpath : $($result.MaxPath) chars (fail limit $MaxPathFail)"
    }
    finally {
        if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp -Recurse -Force }
    }
}
else {
    $result = Build-Package -Destination $mirror
    $version = (Get-Content -LiteralPath $srcManif -Raw | ConvertFrom-Json).version
    $skills = (Get-ChildItem -LiteralPath (Join-Path $mirror 'skills') -Directory).Count
    $files  = (Get-ChildItem -LiteralPath $mirror -Recurse -File -Force).Count
    Write-Host "Codex plugin package built: $mirror" -ForegroundColor Green
    Write-Host "  version : $version"
    Write-Host "  skills  : $skills directories"
    Write-Host "  files   : $files"
    Write-Host "  maxpath : $($result.MaxPath) chars (fail limit $MaxPathFail)"
    Write-Host "Never hand-edit plugins/shaughv-tasks/ - edit root content and re-run this script." -ForegroundColor Cyan
}

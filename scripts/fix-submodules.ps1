param(
    [int]$RetryCount = 3,
    [switch]$UseHttps,
    [string]$GitToken
)

Set-StrictMode -Version Latest

Write-Host "fix-submodules: iniciando (RetryCount=$RetryCount, UseHttps=$UseHttps)"

function Run-Git($args) {
    git $args 2>&1
}

$root = Run-Git "rev-parse --show-toplevel"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Não parece ser um repositório git. Saindo."
    exit 2
}
$root = $root.Trim()
Set-Location $root
Write-Host "Repo root: $root"

Write-Host "Sincronizando submódulos..."
Run-Git "submodule sync --recursive"

if ($UseHttps -or $GitToken) {
    if (-not (Test-Path ".gitmodules")) {
        Write-Host ".gitmodules não encontrado; pulando conversão de URLs."
    } else {
        $lines = Run-Git "config -f .gitmodules --get-regexp 'submodule\..*\.url'" | Out-String
        if ($lines -ne "") {
            $lines -split "`n" | ForEach-Object {
                if ($_ -match '^(submodule\.(.+)\.url)\s+(.+)$') {
                    $key = $matches[1]
                    $name = $matches[2]
                    $url = $matches[3]
                    if ($url -match '^git@github.com:') {
                        $newurl = $url -replace '^git@github.com:', 'https://'
                        if ($GitToken) { $newurl = $newurl -replace '^https://', "https://$GitToken@" }
                        Write-Host "Convertendo submodule '$name' URL: $url -> $newurl"
                        Run-Git "config -f .gitmodules $key '$newurl'" | Out-Null
                        Run-Git "config submodule.$name.url '$newurl'" | Out-Null
                    }
                }
            }
            Run-Git "submodule sync --recursive"
        } else {
            Write-Host "Nenhum URL de submódulo encontrado em .gitmodules."
        }
    }
}

for ($i = 1; $i -le $RetryCount; $i++) {
    Write-Host "Tentativa ${i} de ${RetryCount}: atualizando submódulos..."
    $out = Run-Git "submodule update --init --recursive --force --progress"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Submódulos atualizados com sucesso."
        exit 0
    }
    Write-Warning ("Falha na tentativa ${i}`n$out")

    Write-Host "Executando limpeza: reset hard e clean nos submódulos..."
    Run-Git "submodule foreach --recursive git reset --hard" | Out-Null
    Run-Git "submodule foreach --recursive git clean -ffd" | Out-Null
    Write-Host "Buscando em todos os submódulos..."
    Run-Git "submodule foreach --recursive git fetch --all --tags" | Out-Null
    Start-Sleep -Seconds 2
}

Write-Error "Falha ao atualizar submódulos após $RetryCount tentativas. Reveja as mensagens acima."
exit 1

# Script para commit seguro no GitHub
# Execute este script antes de fazer push

Write-Host "🔒 Verificando arquivos sensíveis..." -ForegroundColor Cyan

# Verifica se arquivos sensíveis estão sendo commitados
$sensiveFiles = @(
    ".env",
    ".env.local",
    ".env.production"
)

$filesToCheck = git diff --cached --name-only

$foundSensitive = $false
foreach ($file in $filesToCheck) {
    if ($sensiveFiles -contains $file) {
        Write-Host "⚠️  ALERTA: Arquivo sensível detectado: $file" -ForegroundColor Red
        $foundSensitive = $true
    }
}

if ($foundSensitive) {
    Write-Host "❌ Commit bloqueado! Remova os arquivos sensíveis primeiro." -ForegroundColor Red
    Write-Host "Execute: git reset HEAD <arquivo>" -ForegroundColor Yellow
    exit 1
}

# Verifica padrões de segredos no diff staged
$diff = git diff --cached
$secretPatterns = @(
    "SUPABASE_SERVICE_ROLE_KEY",
    "service_role",
    "eyJhbGci", # JWTs
    "BEGIN PRIVATE KEY"
)

$foundSecretsInDiff = $false
foreach ($pattern in $secretPatterns) {
    if ($diff -match $pattern) {
        Write-Host "⚠️  ALERTA: Possível segredo no commit (padrão: $pattern)" -ForegroundColor Red
        $foundSecretsInDiff = $true
    }
}

if ($foundSecretsInDiff) {
    Write-Host "❌ Commit bloqueado! Remova/rotacione segredos antes de commitar." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Nenhum arquivo sensível detectado!" -ForegroundColor Green
Write-Host ""
Write-Host "Arquivos que serão commitados:" -ForegroundColor Cyan
git diff --cached --name-only
Write-Host ""
Write-Host "Para continuar com o commit, execute:" -ForegroundColor Yellow
Write-Host "git commit -m 'sua mensagem aqui'" -ForegroundColor White
Write-Host "git push origin main" -ForegroundColor White

@echo off
title Servidor Local - Cadastro Web
cd /d "%~dp0"
echo ========================================
echo   Iniciando Servidor Local
echo   Cadastro Web
echo ========================================
echo.
echo Garantindo porta 3000 livre...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":3000 .*LISTENING"') do (
  echo Encerrando PID %%a na porta 3000...
  taskkill /PID %%a /F >nul 2>&1
)
echo.
echo Abrindo navegador em http://localhost:3000
start "" http://localhost:3000
echo.
echo Iniciando o servidor na porta 3000...
echo.
npm run dev -- -p 3000
pause



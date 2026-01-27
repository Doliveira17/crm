@echo off
title Servidor Local - Cadastro Web
cd /d "%~dp0"
echo ========================================
echo   Iniciando Servidor Local
echo   Cadastro Web
echo ========================================
echo.
echo Abrindo navegador em http://localhost:3000
echo.
start http://localhost:3000
echo Iniciando o servidor...
echo.
npm run dev
pause



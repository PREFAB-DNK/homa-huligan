@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title Хома-хулиган — локальный сервер

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Не найден Node.js.
  echo   Установите LTS-версию с https://nodejs.org/ и запустите этот файл снова.
  echo.
  pause
  exit /b 1
)

echo.
echo   Запускаю игру «Хома-хулиган»...
echo   Браузер откроется через пару секунд.
echo.
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:4173'"
node server.js
echo.
echo   Сервер остановлен. Можно закрыть это окно.
pause

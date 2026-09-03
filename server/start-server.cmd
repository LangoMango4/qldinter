@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed or is not available on PATH.
  echo Install Node.js 18 or newer from https://nodejs.org/ and try again.
  pause
  exit /b 1
)
node server.js
pause

@echo off
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
  echo Killing PID %%a
  taskkill /F /PID %%a >nul 2>&1
)
exit /b 0


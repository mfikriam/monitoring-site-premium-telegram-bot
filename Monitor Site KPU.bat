@echo off
echo Pastikan Anda sudah terhubung ke Globalprotect!
echo.
echo Performing git pull to update the repository...
git pull https://github.com/mfikriam/monitoring-site-premium-telegram-bot.git
if errorlevel 1 (
    echo Git pull failed. Please check your internet connection or repository URL.
    pause
    exit /b
)
echo Repository updated successfully.
echo.

echo Choose server location:
echo [1] Sentul
echo [2] Jatinegara
set /p choice=Enter your choice (1 or 2): 

if "%choice%"=="1" (
    echo Running app-kpu.js with --server=sentul...
    echo.
    node app-kpu.js --server=sentul
) else if "%choice%"=="2" (
    echo Running app-kpu.js with --server=jatinegara...
    echo.
    node app-kpu.js --server=jatinegara
) else (
    echo Invalid choice. Exiting.
    exit /b
)

pause

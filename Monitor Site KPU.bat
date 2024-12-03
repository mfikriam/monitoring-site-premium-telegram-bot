@echo off
echo Pastikan Anda sudah terhubung ke Globalprotect!
echo.
echo Performing git fetch and reset to update the repository...
git fetch origin
if errorlevel 1 (
    echo Git fetch failed. Please check your internet connection or repository URL.
    pause
    exit /b
)
git reset --hard origin/main
if errorlevel 1 (
    echo Git reset failed. Please check your repository or branch name.
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
    echo Running start:kpu:sentul...
    echo.
    npm run start:kpu:sentul
) else if "%choice%"=="2" (
    echo Running start:kpu:jatinegara...
    echo.
    npm run start:kpu:jatinegara
) else (
    echo Invalid choice. Exiting.
    exit /b
)

pause

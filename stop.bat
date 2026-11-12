@echo off
title HypeZone Studio Invoice - Stop Services
echo ===================================================
echo Menghentikan Server HypeZone Studio...
echo ===================================================
echo.

echo Menghentikan proses Backend (Port 5000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>nul
    echo Process port 5000 dihentikan (PID: %%a)
)

echo Menghentikan proses Frontend (Port 3000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>nul
    echo Process port 3000 dihentikan (PID: %%a)
)

echo.
echo ===================================================
echo Seluruh layanan HypeZone Studio berhasil dihentikan.
echo ===================================================
timeout /t 2 >nul

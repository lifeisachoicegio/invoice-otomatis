@echo off
title HypeZone Studio Invoice - Installer
echo ===================================================
echo HYPEZONE STUDIO INVOICE MANAGEMENT SYSTEM
echo Automated Environment Setup and Dependency Installer
echo ===================================================
echo.

:: 1. Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js tidak ditemukan! Harap install Node.js versi 18+ terlebih dahulu.
    pause
    exit /b 1
)
echo [OK] Node.js terdeteksi.

:: 2. Check npm
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm tidak ditemukan!
    pause
    exit /b 1
)
echo [OK] npm terdeteksi.

:: 3. Setup Backend
echo.
echo [1/3] Menginstal dependensi Backend (Express + SQLite + Puppeteer)...
cd /d "%~dp0server"
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Gagal menginstal dependensi server.
    pause
    exit /b 1
)

:: 4. Setup Frontend
echo.
echo [2/3] Menginstal dependensi Frontend (React + Vite + Tailwind CSS)...
cd /d "%~dp0client"
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Gagal menginstal dependensi client.
    pause
    exit /b 1
)

:: 5. Done
echo.
echo ===================================================
echo [SUKSES] Seluruh dependensi berhasil diinstal!
echo Jalankan 'start.bat' untuk menyalakan aplikasi.
echo ===================================================
pause

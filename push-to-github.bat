@echo off
setlocal enabledelayedexpansion
title Push Kai Personal Website to GitHub

cd /d "%~dp0"

echo ===================================================
echo   Kai Personal Website - GitHub Push
echo ===================================================
echo.

set "GIT_EXE=C:\Users\88697\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"

if not exist "!GIT_EXE!" (
    echo [ERROR] Git binary not found at:
    echo !GIT_EXE!
    echo.
    pause
    exit /b 1
)

echo Current Directory: %CD%
echo Using Git: !GIT_EXE!
echo.

echo [1/2] Pushing test-merge to origin:ux/mobile-article-reading...
"!GIT_EXE!" push origin test-merge:ux/mobile-article-reading --force
set "P1_EXIT=!ERRORLEVEL!"

echo.
echo [2/2] Pushing test-merge to origin:main...
"!GIT_EXE!" push origin test-merge:main --force
set "P2_EXIT=!ERRORLEVEL!"

echo.
echo ===================================================
if "!P1_EXIT!"=="0" if "!P2_EXIT!"=="0" (
    echo [SUCCESS] Both branches pushed successfully!
    echo Netlify will automatically trigger production deployment.
) else (
    echo [NOTICE] Push returned code: P1=!P1_EXIT!, P2=!P2_EXIT!
    echo If this failed due to credentials or network, please check your connection.
)
echo ===================================================
echo.
pause

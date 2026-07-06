@echo off
setlocal

set "GIT_BASH="

REM Common install locations first.
if exist "%ProgramFiles%\Git\bin\bash.exe" set "GIT_BASH=%ProgramFiles%\Git\bin\bash.exe"
if not defined GIT_BASH if exist "%ProgramFiles(x86)%\Git\bin\bash.exe" set "GIT_BASH=%ProgramFiles(x86)%\Git\bin\bash.exe"
if not defined GIT_BASH if exist "%LocalAppData%\Programs\Git\bin\bash.exe" set "GIT_BASH=%LocalAppData%\Programs\Git\bin\bash.exe"

REM Fall back to asking git itself where it lives (covers custom installs).
REM Deliberately NOT using `where bash`: on machines with WSL installed,
REM that resolves to C:\Windows\System32\bash.exe (the WSL launcher), which
REM tries to run this script inside WSL against a Windows path and fails.
if not defined GIT_BASH (
    for /f "delims=" %%P in ('git --exec-path 2^>nul') do set "GIT_EXEC_PATH=%%P"
    if defined GIT_EXEC_PATH if exist "%GIT_EXEC_PATH%\..\..\..\bin\bash.exe" set "GIT_BASH=%GIT_EXEC_PATH%\..\..\..\bin\bash.exe"
)

if not defined GIT_BASH (
    echo Could not find Git Bash. Install Git for Windows: https://git-scm.com/download/win
    pause
    exit /b 1
)

"%GIT_BASH%" "%~dp0dev.sh"

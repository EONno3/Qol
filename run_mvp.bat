@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

set "ROOT=%~dp0"
set "MODEL_REL=model\gemma 4 E4B it - gguf\gemma-4-E4B-it-Q4_K_M.gguf"
set "MODEL=%ROOT%%MODEL_REL%"

echo ===================================================
echo [Cyberpunk MVP] One-Click Launcher
echo ===================================================
echo.

echo [1/5] Checking Vite Dev Server...
netstat -ano | findstr "LISTENING" | findstr ":5173" > nul
if %errorlevel% neq 0 (
    echo [INFO] Starting Vite Dev Server...
    start "Vite Dev Server" cmd /k "cd /d "%ROOT%" && npm run dev"
    timeout /t 3 /nobreak > nul
) else (
    echo [INFO] Vite Dev Server already running.
)

echo [2/5] Checking llama-server (GGUF inference engine)...
curl.exe -s -o nul --max-time 3 http://127.0.0.1:8080/health
if %errorlevel% neq 0 (
    echo [INFO] Starting llama-server on :8080 - continuous batching np 2...
    start "Llama Server GGUF" cmd /k "cd /d "%ROOT%" && tools\llama-server\llama-server.exe --model "%MODEL%" --host 127.0.0.1 --port 8080 -np 2 -c 8192 -ngl 99"
    timeout /t 2 /nobreak > nul
) else (
    echo [INFO] llama-server already running.
)

echo [3/5] Checking AI Narrator Proxy...
curl.exe -s -o nul --max-time 3 http://127.0.0.1:5001/health
if %errorlevel% neq 0 (
    echo [INFO] Starting narrator proxy on :5001...
    start "AI Narrator Proxy" cmd /k "cd /d "%ROOT%" && set PYTHONIOENCODING=utf-8 && .\venv\Scripts\python -X utf8 scripts/ai_pipeline/narrator_server.py"
    timeout /t 2 /nobreak > nul
) else (
    echo [INFO] Narrator proxy already running.
)

echo.
echo [4/5] Waiting for AI stack (model load, up to 150s)...
echo.
set AI_WAIT_RETRY=0

:WAIT_FOR_AI
curl.exe -f -s -o nul --max-time 5 http://127.0.0.1:5001/health
if %errorlevel% equ 0 goto AI_READY

set /a AI_WAIT_RETRY+=1
if !AI_WAIT_RETRY! geq 30 (
    echo [ERROR] AI server not ready within 150 seconds.
    echo [HINT] Check the "Llama Server GGUF" and "AI Narrator Proxy" windows.
    pause
    exit /b 1
)
echo [WAIT !AI_WAIT_RETRY!/30] Inference engine loading... retry in 5s
timeout /t 5 /nobreak > nul
goto WAIT_FOR_AI

:AI_READY
echo.
echo ===================================================
echo [AI ONLINE] Inference engine + narrator proxy ready.
echo ===================================================
echo.

echo [5/5] Opening browser...
start "" "http://localhost:5173"

echo.
echo [Real AI Mode] Generating missions (about 30-60s, browser reloads via HMR)
echo Do not close this window.
echo.
set "WORLD_STATE_FILE=scripts\ai_pipeline\runtime_world_state.json"
if not exist "%WORLD_STATE_FILE%" (
    echo [WARN] runtime_world_state.json missing - using test_world_state.json
    set "WORLD_STATE_FILE=scripts\ai_pipeline\test_world_state.json"
)
chcp 65001 > nul 2>&1
set PYTHONIOENCODING=utf-8
".\venv\Scripts\python.exe" scripts/ai_pipeline/batch_generate_missions.py "%MODEL%" --state "%WORLD_STATE_FILE%"
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Mission generation failed. See the error above.
    pause
    exit /b 1
)

echo.
echo ===================================================
echo  Missions generated. Browser: http://localhost:5173
echo ===================================================
pause

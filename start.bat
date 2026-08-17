@echo off
echo ===================================================
echo Starting PatientTriage.ai Clinical Decision Support
echo ===================================================

echo [1/2] Launching FastAPI Backend on http://localhost:8000 ...
start "PatientTriage Backend" cmd /k "cd backend && python -m uvicorn app.main:app --reload --port 8000"

echo [2/2] Launching React Vite Frontend on http://localhost:5173 ...
start "PatientTriage Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo PatientTriage.ai is booting up!
echo Backend API Docs: http://localhost:8000/docs
echo Frontend Portal:  http://localhost:5173
echo ===================================================

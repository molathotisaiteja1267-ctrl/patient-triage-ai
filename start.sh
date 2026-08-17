#!/usr/bin/env bash
echo "==================================================="
echo "Starting PatientTriage.ai Clinical Decision Support"
echo "==================================================="

# Start backend in background
cd backend && python -m uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# Start frontend in background
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo "PatientTriage.ai is running!"
echo "Backend API: http://localhost:8000/docs"
echo "Frontend UI:  http://localhost:5173"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait

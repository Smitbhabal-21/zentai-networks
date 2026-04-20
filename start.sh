# Zentai Networks BI Terminal — Start All Servers
# Run from the project root

echo "🚀 Starting Zentai Networks BI Terminal..."

# Backend (FastAPI)
echo "📡 Starting FastAPI backend on http://localhost:8000..."
(cd backend && python3 -m uvicorn main:app --reload --port 8000) &
BACKEND_PID=$!
sleep 2

# Frontend (Vite)
echo "🖥️  Starting React frontend on http://localhost:5173..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers started!"
echo "   Backend API:  http://localhost:8000"
echo "   Dashboard UI: http://localhost:5173"
echo "   API Docs:     http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

# Wait and cleanup
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Servers stopped.'" EXIT
wait

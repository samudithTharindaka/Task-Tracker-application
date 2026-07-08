#!/usr/bin/env bash
# One-click local dev: Postgres (docker), backend, and frontend together.
# Ctrl+C stops backend + frontend; Postgres keeps running (fast restarts,
# no re-provisioning). Stop it yourself with `docker compose down` when done.
#
# Backend and frontend output is piped into logs/backend.log and
# logs/frontend.log. Tail them live in separate terminals with:
#   tail -f logs/backend.log
#   tail -f logs/frontend.log
set -e

cd "$(dirname "$0")"

mkdir -p logs

# On Windows/Git Bash, npm wraps its child process in a way that can escape
# plain job-control signals, so a crashed terminal or a previous run that
# didn't exit cleanly can leave node/vite still bound to these ports —
# causing the next run to fail with EADDRINUSE. Force-free them both before
# starting and on exit. No-op on Linux/macOS (no powershell.exe there).
free_dev_ports() {
  if command -v powershell.exe >/dev/null 2>&1; then
    for port in 4000 5173; do
      powershell.exe -NoProfile -Command \
        "Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id \$_.OwningProcess -Force -ErrorAction SilentlyContinue }" \
        >/dev/null 2>&1 || true
    done
  fi
}

echo "Starting Postgres..."
docker compose up -d postgres || { echo "Failed to start Postgres"; exit 1; }

echo "Freeing ports 4000/5173 from any leftover process..."
free_dev_ports

cleanup() {
  echo ""
  echo "Stopping backend and frontend..."
  # `kill $PID` alone only kills the subshell, not npm's actual child
  # process (vite/node) — kill 0 signals the whole process group instead.
  kill 0 2>/dev/null
  free_dev_ports
}
trap cleanup EXIT INT TERM

echo "Starting backend (logs: logs/backend.log)..."
(cd backend && npm run dev > ../logs/backend.log 2>&1) &

echo "Starting frontend (logs: logs/frontend.log)..."
(cd frontend && npm run dev > ../logs/frontend.log 2>&1) &

echo ""
echo "Backend and frontend running in background."
echo "Tail logs live in separate terminals with:"
echo "  tail -f logs/backend.log"
echo "  tail -f logs/frontend.log"
echo ""
echo "Press Ctrl+C here to stop backend and frontend (Postgres keeps running)."
echo ""

wait
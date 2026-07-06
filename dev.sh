#!/usr/bin/env bash
# One-click local dev: Postgres (docker), backend, and frontend together.
# Ctrl+C stops backend + frontend; Postgres keeps running (fast restarts,
# no re-provisioning). Stop it yourself with `docker compose down` when done.
set -e

cd "$(dirname "$0")"

echo "Starting Postgres..."
docker compose up -d postgres

cleanup() {
  echo ""
  echo "Stopping backend and frontend..."
  # `kill $PID` alone only kills the subshell, not npm's actual child
  # process (vite/node) — kill 0 signals the whole process group instead.
  kill 0 2>/dev/null

  # On Windows/Git Bash, npm wraps its child process in a way that can
  # escape plain job-control signals. Force-free the known dev ports as a
  # safety net so nothing is ever left running in the background. No-op on
  # Linux/macOS (no powershell.exe there).
  if command -v powershell.exe >/dev/null 2>&1; then
    for port in 4000 5173; do
      powershell.exe -NoProfile -Command \
        "Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id \$_.OwningProcess -Force -ErrorAction SilentlyContinue }" \
        >/dev/null 2>&1
    done
  fi
}
trap cleanup EXIT INT TERM

echo "Starting backend..."
(cd backend && npm run dev) &

echo "Starting frontend..."
(cd frontend && npm run dev) &

wait

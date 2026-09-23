#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
PYTHON_BIN="${PYTHON_BIN:-python3}"
"$PYTHON_BIN" api/analytics.py &
ANALYTICS_PID=$!
trap 'kill "$ANALYTICS_PID" 2>/dev/null || true' EXIT INT TERM
npm run dev

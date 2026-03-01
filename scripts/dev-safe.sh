#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

./scripts/clean-next-lock.sh

PID_FILE="/tmp/pnpm-dev.pid"

if [[ -f "$PID_FILE" ]]; then
  PID="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "$PID" ]] && kill -0 "$PID" 2>/dev/null; then
    echo "⚠️ Stopping previous pnpm dev (pid=$PID)"
    kill "$PID" || true
    sleep 2
    kill -9 "$PID" 2>/dev/null || true
  fi
  rm -f "$PID_FILE"
fi

trap 'rm -f "$PID_FILE"' EXIT

pnpm dev &
DEV_PID=$!
echo "$DEV_PID" > "$PID_FILE"
wait "$DEV_PID"


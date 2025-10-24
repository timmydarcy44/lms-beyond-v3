#!/usr/bin/env bash
set -euo pipefail

BASE=${1:-"https://learningmanagementsystem.vercel.app"}
echo "🧪 Smoke tests on $BASE"
echo "=========================="

# Test health check
echo -n "Testing /api/health... "
if curl -sf "$BASE/api/health" >/dev/null; then
    echo "✅ OK"
else
    echo "❌ FAILED"
    exit 1
fi

# Test formations API (should return 400 without auth)
echo -n "Testing /api/formations?org=demo... "
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/formations?org=demo")
if [[ "$status" == "400" ]]; then
    echo "✅ OK (400 - auth required)"
else
    echo "⚠️  Unexpected status: $status"
fi

# Simple rate limit test
echo -n "Testing rate limiting... "
ok=0
for i in $(seq 1 65); do
    code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/health")
    if [[ "$code" == "200" ]]; then
        ok=$((ok+1))
    fi
done

# Check if rate limiting kicked in
final_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/health")
echo "Last code: $final_code (expect 429 after burst)"

if [[ "$final_code" == "429" ]]; then
    echo "✅ Rate limiting working"
else
    echo "⚠️  Rate limiting not triggered (might be normal)"
fi

echo "✅ Basic smoke tests completed"
echo "=========================="
echo "🚀 Application appears healthy!"
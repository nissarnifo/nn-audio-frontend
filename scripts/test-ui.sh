#!/bin/bash
# UI smoke tests — checks key pages return 200 and expected content

VERCEL_URL="https://nn-audio-frontend-sj3j.vercel.app"
PASS=0
FAIL=0

check() {
  local label="$1"
  local url="$2"
  local expect="$3"  # optional string to look for in response

  STATUS=$(curl -s -o /tmp/ui_test_body.html -w "%{http_code}" "$url" 2>/dev/null || echo "000")

  if [[ "$STATUS" == "200" ]]; then
    if [[ -n "$expect" ]]; then
      if grep -qi "$expect" /tmp/ui_test_body.html 2>/dev/null; then
        echo "  ✓ $label ($url) — found '$expect'"
        PASS=$((PASS+1))
      else
        echo "  ✗ $label ($url) — 200 but missing '$expect'"
        FAIL=$((FAIL+1))
      fi
    else
      echo "  ✓ $label ($url) — HTTP $STATUS"
      PASS=$((PASS+1))
    fi
  else
    echo "  ✗ $label ($url) — HTTP $STATUS"
    FAIL=$((FAIL+1))
  fi
}

echo "--- UI Tests ---"
check "Home page"     "$VERCEL_URL"               ""
check "Login page"   "$VERCEL_URL/auth/login"     "login"
check "Products"     "$VERCEL_URL/products"       ""
check "404 handling" "$VERCEL_URL/nonexistent-xyz" ""

echo ""
echo "Results: $PASS passed, $FAIL failed"
[[ "$FAIL" -eq 0 ]] && exit 0 || exit 1

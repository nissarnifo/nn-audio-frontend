#!/bin/bash
set -e

BRANCH="claude/setup-nn-audio-frontend-lE9Z1"
REPO="nissarnifo/nn-audio-frontend"
VERCEL_URL="https://nn-audio-frontend-sj3j.vercel.app"

echo "=== Auto Deploy Pipeline ==="

# 1. Build check
echo "▶ Running build check..."
cd "$(dirname "$0")/.."
npm run build 2>&1 | tail -8
echo "✓ Build passed"

# 2. Stage & commit if there are changes
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "▶ Changes detected, committing..."
  git add -A
  git commit -m "$(git log -1 --pretty=%s HEAD 2>/dev/null || echo 'feat: auto-deploy update')"
fi

# 3. Push to feature branch
echo "▶ Pushing to $BRANCH..."
git push -u origin HEAD:$BRANCH
echo "✓ Pushed"

# 4. Create or update PR
echo "▶ Creating PR..."
EXISTING_PR=$(gh pr list --repo "$REPO" --head "$BRANCH" --json number -q '.[0].number' 2>/dev/null)
if [[ -n "$EXISTING_PR" ]]; then
  echo "  PR #$EXISTING_PR already exists, updating..."
  PR_NUM=$EXISTING_PR
else
  PR_NUM=$(gh pr create \
    --repo "$REPO" \
    --base main \
    --head "$BRANCH" \
    --title "$(git log -1 --pretty=%s)" \
    --body "Auto-deployed via Claude" \
    --json number -q '.number' 2>/dev/null)
  echo "✓ Created PR #$PR_NUM"
fi

# 5. Merge PR
echo "▶ Merging PR #$PR_NUM..."
gh pr merge "$PR_NUM" --repo "$REPO" --merge --delete-branch=false
echo "✓ Merged to main"

# 6. Wait for Vercel deploy
echo "▶ Waiting for Vercel deployment (up to 3 min)..."
for i in {1..18}; do
  sleep 10
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$VERCEL_URL" 2>/dev/null || echo "000")
  echo "  [$((i*10))s] HTTP $STATUS"
  if [[ "$STATUS" == "200" ]]; then
    echo "✓ Site is live"
    break
  fi
done

# 7. Test UI
echo "▶ Testing UI..."
bash "$(dirname "$0")/test-ui.sh"

echo ""
echo "=== Pipeline Complete ==="

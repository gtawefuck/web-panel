#!/bin/bash

# ──────────────────────────────────────────────
#  Auto-commit & push watcher for web-panel
# ──────────────────────────────────────────────
REPO_DIR="/Users/shivamkumarchaurasiya/ant/web-panel"
BRANCH="main"
POLL_INTERVAL=5   # seconds between checks
LOG_FILE="$REPO_DIR/.auto_commit.log"

cd "$REPO_DIR" || exit 1

echo "[$(date)] Auto-commit watcher started. Watching: $REPO_DIR" | tee -a "$LOG_FILE"

while true; do
    # Stage all changes (new, modified, deleted)
    git add -A

    # Check if there is anything to commit
    if ! git diff --cached --quiet; then
        COMMIT_MSG="auto: $(date '+%Y-%m-%d %H:%M:%S') — $(git diff --cached --name-only | head -5 | tr '\n' ', ' | sed 's/,$//')"
        git commit -m "$COMMIT_MSG" >> "$LOG_FILE" 2>&1

        if git push origin "$BRANCH" >> "$LOG_FILE" 2>&1; then
            echo "[$(date)] ✅ Pushed: $COMMIT_MSG" | tee -a "$LOG_FILE"
        else
            echo "[$(date)] ❌ Push failed — will retry next cycle" | tee -a "$LOG_FILE"
        fi
    fi

    sleep "$POLL_INTERVAL"
done

#!/bin/bash
# Claude Code hook: PostToolUse (Write | Edit)
# FE 파일 변경 시 → pnpm lint + pnpm test run
# BE 파일 변경 시 → ./gradlew test

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('file_path', ''))
except Exception:
    print('')
")

[ -z "$FILE_PATH" ] && exit 0

ROOT_DIR="${CLAUDE_PROJECT_DIR:-$(git -C "$(dirname "$FILE_PATH")" rev-parse --show-toplevel 2>/dev/null)}"
ROOT_DIR="${ROOT_DIR:-$(pwd)}"

if [[ "$FILE_PATH" == *"/frontend/"* || "$FILE_PATH" == *"\\frontend\\"* ]]; then
    echo "=== Frontend 파일 변경 감지: lint + test 실행 ===" >&2
    cd "$ROOT_DIR/frontend" || exit 1
    pnpm lint && pnpm test run
elif [[ "$FILE_PATH" == *"/backend/"* || "$FILE_PATH" == *"\\backend\\"* ]]; then
    echo "=== Backend 파일 변경 감지: test 실행 ===" >&2
    cd "$ROOT_DIR/backend" || exit 1
    ./gradlew test
fi

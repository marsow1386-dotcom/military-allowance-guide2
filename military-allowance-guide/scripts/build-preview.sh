#!/usr/bin/env bash
# 서버 없이 열리는 정적 미리보기를 out/ 에 만듭니다. (챗봇은 규칙 기반으로 동작)
# 정적 내보내기는 API 라우트를 지원하지 않아, 빌드하는 동안만 app/api 를 옮겨 둡니다.
set -euo pipefail
cd "$(dirname "$0")/.."
mv app/api .api-preview-tmp
trap 'mv .api-preview-tmp app/api' EXIT
NEXT_PUBLIC_STATIC_PREVIEW=1 NEXT_TELEMETRY_DISABLED=1 npx next build

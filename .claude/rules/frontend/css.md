---
paths: frontend/**/*.{ts,tsx}
---

### CSS 클래스 유틸리티
- `cn()` 함수 사용 (`~/libs/cn`) — `clsx` + `tailwind-merge` 조합
- 직접 `clsx`나 `twMerge` 사용 금지, 항상 `cn()`으로 통일

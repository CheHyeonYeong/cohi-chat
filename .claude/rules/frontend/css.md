---
paths: frontend/**/*.{ts,tsx}
---

### CSS 클래스 유틸리티
- `cn()` 함수 사용 (`~/libs/cn`) — `clsx` + `tailwind-merge` 조합
- 직접 `clsx`나 `twMerge` 사용 금지, 항상 `cn()`으로 통일

### cohi 디자인 토큰 규칙
- `@theme`에 `--color-cohi-*` 등록 → Tailwind 네이티브 클래스(`bg-cohi-primary`, `text-cohi-text-dark` 등) 사용 가능
- TSX/TS에서 `var(--cohi-*)` arbitrary value 사용 금지 → Tailwind 네이티브 클래스 사용
  - Good: `bg-cohi-primary`, `text-cohi-text-dark`, `border-cohi-primary/20`
  - Bad: `bg-[var(--cohi-primary)]`, `text-[var(--cohi-text-dark)]`, `border-[var(--cohi-primary)]/20`
- `:root`에 `--cohi-*` legacy alias 없음 — `var(--cohi-*)` 참조 시 빌드는 되지만 색상이 적용되지 않음
- CSS 파일(`index.css`)의 `.cohi-btn-*` 등에서는 `var(--color-cohi-*)` 사용 (CSS context이므로 var() 필요)
- opacity modifier(`/20`, `/50` 등)는 네이티브 클래스에 그대로 붙여 사용: `border-cohi-primary/20`

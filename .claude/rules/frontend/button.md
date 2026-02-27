---
paths: frontend/**/*.{ts,tsx}
---

### Button 사용 규칙
- 표준 버튼은 반드시 `<Button>` 컴포넌트 사용 (`~/components/button`)
- 라우터 링크 + 버튼 스타일: `<LinkButton>` 사용 (`~/components/button/LinkButton`)
  - TanStack Router `Link`의 타입 안전성을 유지하면서 Button 스타일 적용
  - 예: `<LinkButton variant="primary" to="/path">텍스트</LinkButton>`
  - `<Link>` + `cohi-btn-*` 클래스 직접 조합 금지 → 반드시 `<LinkButton>` 사용
- 비동기 작업 중 버튼: `loading` prop 사용 (자동 disabled + CSS `:disabled` 스타일)
- `asChild` prop: Button을 다른 요소로 렌더링 (Radix Slot 패턴)
- raw `<button>` 허용: 아이콘 전용, 토글, 텍스트 링크 스타일, 특수 목적 버튼만
- `type` 기본값은 `"button"`. 폼 제출 시 `type="submit"` 명시 필수
- `className`은 정적 문자열만 전달 (Button 내부에서 `twMerge`로 충돌 해결)

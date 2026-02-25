### Header 사용 규칙
- 페이지 상단 네비게이션 헤더는 반드시 `<Header>` 컴포넌트 사용 (`~/components/header`)
  - 로고(CoffeeCupIcon + "coheChat") + 홈 링크가 자동 포함
  - `center` prop: 중앙 영역 (예: StepIndicator, 브레드크럼)
  - `right` prop: 우측 영역 (예: 인증 버튼, 아바타)
  - `className` prop: 추가 스타일 (`cn()`으로 머지)
- 각 페이지에서 `<header>` + 로고를 직접 작성 금지 → 반드시 `<Header>` 사용
- 3-column 레이아웃(center 있을 때) 균형이 필요하면 빈 spacer를 `right`에 전달
- LoginForm처럼 중앙 정렬 로고만 필요한 경우는 Header 대상 아님 (별도 인라인 처리)

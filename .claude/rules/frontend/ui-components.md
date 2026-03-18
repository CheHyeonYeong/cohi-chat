---
paths: frontend/**/*.{ts,tsx}
---

### Tag 사용 규칙
- 라벨/태그/카테고리 표시 시 반드시 `<Tag>` 컴포넌트 사용 (`~/components/Tag`)
- 용도: 토픽 태그, 키워드 뱃지, 카테고리 라벨 등 짧은 텍스트 라벨
- raw `<span>` + Tailwind 클래스로 태그 스타일 직접 구현 금지
- Props:
  - `variant`: `'filled'`(기본) | `'outlined'` | `'borderless'`
  - `color`: `'primary'`(기본) | `'secondary'` | `'default'` | `'guest'` | `'host'`
  - `size`: `'sm'` | `'md'`(기본)
- 삭제 가능한 태그: `<Tag>` 내부에 `<button>` 배치하여 구현
  - 예: `<Tag className="gap-1">{text}<button onClick={onRemove}>✕</button></Tag>`
- 태그 목록은 `flex flex-wrap gap-2` 컨테이너로 감싼다
- 토픽(topic) 표시 시 반드시 `<Tag>` 컴포넌트로 감싸야 한다
  - 예: BookingCard, HostCard, HostProfileCard 등 모든 곳에서 동일하게 적용
  - raw `<p>` 또는 `<span>`으로 토픽을 직접 표시 금지

### Card 사용 규칙
- 콘텐츠 영역을 카드 형태로 감쌀 때 반드시 `<Card>` 컴포넌트 사용 (`~/components/card`)
- 용도: 프로필 카드, 예약 카드, 설정 섹션, 폼 컨테이너 등 콘텐츠 그룹핑
- raw `<div>` + `rounded-2xl bg-white shadow-*` 등으로 카드 스타일 직접 구현 금지
- Props:
  - `variant`: `'default'`(shadow-sm) | `'elevated'`(shadow-md) | `'prominent'`(shadow-lg)
  - `size`: `'sm'`(p-5) | `'md'`(p-6, 기본) | `'lg'`(p-8)
  - `title`: 카드 상단에 `<h3>` 제목 자동 삽입
  - `asChild`: Radix Slot 패턴 — 카드 스타일을 자식 요소에 위임 (예: `<button>`)
  - `noBackground`: 흰색 배경 제거
  - `noShadow`: shadow 제거 (Card 안에 Card가 중첩될 때 사용)
- 클릭 가능한 카드: `<Card asChild>` + `<button>` 조합 사용
  - 예: `<Card asChild size="sm"><button type="button">{content}</button></Card>`

### Pagination 사용 규칙
- 페이지네이션은 반드시 `<Pagination>` 컴포넌트 사용 (`~/components/Pagination`)
- 버튼은 `variant="outline"` 사용 (디자인 시스템 `--cohi-primary` 톤 통일)
- 문구는 한글: "이전" / "다음" / "{page} / {totalPages} 페이지"
- 목록-상세 레이아웃에서 Pagination은 목록 하단에 고정 배치 (목록 크기에 따라 y 위치가 변하지 않도록)

### PageLayout 사용 규칙
- 일반 페이지(Header + 제목 + 콘텐츠)는 반드시 `<PageLayout>` 컴포넌트 사용 (`~/components`)
- `div > Header > main > div.max-w > h1` 보일러플레이트 직접 조합 금지
- Props:
  - `title`: 페이지 제목 (`<h1>` 렌더링 + `document.title` 자동 설정)
  - `headerCenter`: Header 중앙 슬롯 (예: StepIndicator)
  - `maxWidth`: `'sm'` ~ `'6xl'` (기본 `'6xl'`)
  - `className`: main 내부 추가 클래스
- `AuthPageLayout`은 인증 페이지 전용 (로그인, 회원가입, 비밀번호 재설정)
- `PageLayout`은 일반 페이지 전용 (설정, 예약 목록, 호스트 등록 등)
- 예외: Home, Calendar 등 고유 레이아웃 페이지는 직접 구성

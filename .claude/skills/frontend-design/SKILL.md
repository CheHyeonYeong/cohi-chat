# Frontend Design Skill

> Source: anthropics/skills

## Core Principles

**Design Strategy**: Begin by understanding context—purpose, audience, tone, and technical constraints—then commit to a bold aesthetic direction that feels intentional rather than random.

## Key Guidelines

- Select distinctive typography; avoid common defaults like Arial or Inter
- Develop cohesive color schemes with dominant hues and sharp accents
- Implement thoughtful animations and micro-interactions
- Use unexpected spatial composition with asymmetry and negative space
- Add atmospheric details through textures, gradients, or custom effects

## What to Avoid

- Generic aesthetics including predictable font families
- Clichéd gradient schemes
- Cookie-cutter layouts
- Overused design patterns that lack contextual character

## Implementation Philosophy

Match code complexity to your aesthetic vision:
- Elaborate designs warrant extensive animations
- Refined minimalism requires precision in spacing and typography

**Remember**: Truly memorable interfaces result from committed creative choices specific to their purpose, rather than convergence on safe, conventional solutions.

## Project Conventions (cohiChat)

### 버튼
- 표준 버튼: `<Button>` 컴포넌트 (`~/components/button`)
- 라우터 링크 + 버튼 스타일: `<LinkButton>` (`~/components/button/LinkButton`)
- 비동기 작업: `loading` prop 사용 (자동 disabled 처리)
- raw `<button>`: 아이콘 전용, 토글, 특수 목적만 허용
- `type` 기본값 `"button"`, 폼 제출 시 `type="submit"` 명시

### 헤더
- 페이지 상단 네비게이션: 반드시 `<Header>` 컴포넌트 (`~/components/header`)
  - `center` prop: 중앙 영역 (StepIndicator, 브레드크럼 등)
  - `right` prop: 우측 영역 (인증 버튼, 아바타 등)
  - `className` prop: 추가 스타일 (`cn()`으로 머지)
- `<header>` + 로고 직접 작성 금지

### CSS 유틸리티
- 클래스 조합: `cn()` 함수 사용 (`~/libs/cn`) — clsx + tailwind-merge
- `clsx`, `twMerge` 직접 사용 금지

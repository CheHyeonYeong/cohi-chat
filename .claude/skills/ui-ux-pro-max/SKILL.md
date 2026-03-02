# UI/UX Pro Max - Design Intelligence

> Source: nextlevelbuilder/ui-ux-pro-max-skill

## Overview

포괄적인 웹/모바일 애플리케이션 디자인 가이드

- 50+ UI 스타일
- 97개 색상 팔레트
- 57개 폰트 조합
- 9개 기술 스택 지원 (React, Vue, Next.js, Svelte, SwiftUI 등)

## Priority Rules (우선순위별 규칙)

### 1. Accessibility (필수)
- **4.5:1** 최소 명도 대비
- 모든 인터랙티브 요소에 포커스 상태
- 이미지에 alt 텍스트

### 2. Touch/Interaction (필수)
- **44x44px** 최소 터치 타겟 크기
- 충분한 클릭 영역 확보

### 3. Performance (높음)
- 이미지 최적화 (WebP, lazy loading)
- 콘텐츠 리플로우 방지 (width/height 명시)

### 4. Layout/Responsive (높음)
- 올바른 뷰포트 설정
- 가독성 있는 글씨 크기 (최소 16px)

### 5. Typography/Color (중간)
- 일관된 타입 스케일
- 브랜드 색상 시스템

### 6. Animation (중간)
- 150-300ms 트랜지션
- `prefers-reduced-motion` 존중

### 7. Style Selection (중간)
- 프로젝트 맥락에 맞는 스타일 선택

### 8. Charts/Data (낮음)
- 적절한 차트 유형 선택
- 데이터 시각화 접근성

## Must Do

- 모든 클릭 가능 요소에 `cursor-pointer`
- 부드러운 전환 (150-300ms)
- 라이트/다크 모드 모두에서 경계선 가시성
- 호버/포커스/액티브 상태 정의

## Must Avoid

- 이모지를 UI 아이콘으로 사용 (SVG 사용)
- 호버 상태에서 레이아웃 시프트 발생
- 명도 대비 부족 (최소 4.5:1 필수)
- 터치 타겟 너무 작음

## Design Workflow

```
1. 요구사항 분석
2. 디자인 시스템 생성 (색상, 타이포, 스페이싱)
3. 컴포넌트 설계
4. 반응형 레이아웃 적용
5. 접근성 검증
```

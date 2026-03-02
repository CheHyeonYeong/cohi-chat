# Web Application Testing Skill

> Source: anthropics/skills

## Testing Strategy

### Decision Framework

1. **Static HTML** - directly read files to identify selectors
2. **Dynamic apps without running servers** - use helper scripts to launch servers
3. **Running servers** - perform reconnaissance first (screenshots, DOM inspection), then execute actions

## Critical Implementation Pattern

**CRITICAL: Wait for JS to execute** via `page.wait_for_load_state('networkidle')` before inspecting dynamic content. This prevents premature DOM analysis.

## Key Best Practices

- Treat bundled scripts as black-box utilities
- Use synchronous Playwright (`sync_playwright()`)
- Always terminate browsers after completion
- Employ descriptive selectors (text-based, role-based, or CSS)
- Include appropriate waits between actions

## Selector Priority

Testing Library 쿼리 우선순위:
1. `getByRole` (가장 권장 - 접근성 기반)
2. `getByText` (텍스트 기반)
3. `getByTestId` (`data-testid` 속성)
4. `querySelector('[data-testid="..."]')` (마지막 수단)

**CSS 클래스(`.cursor-pointer`, `.text-xs` 등)를 셀렉터로 사용 금지**
- 반드시 `data-testid` 속성으로 요소를 선택한다
- 컴포넌트에 `data-testid`가 없으면 컴포넌트 소스에 추가한 후 테스트 작성

## Server Management

- Helper scripts manage server lifecycle
- Support multiple concurrent servers
- Always run scripts with `--help` first to see usage

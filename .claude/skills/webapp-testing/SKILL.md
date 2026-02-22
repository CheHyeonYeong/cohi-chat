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

1. Text-based selectors (most readable)
2. Role-based selectors (accessibility)
3. CSS selectors (fallback)

## Server Management

- Helper scripts manage server lifecycle
- Support multiple concurrent servers
- Always run scripts with `--help` first to see usage

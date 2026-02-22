# Test-Driven Development Workflow

> Source: affaan-m/everything-claude-code

## Core Rule

**ALWAYS write tests first, then implement code to make tests pass.**

Target: **80%+ code coverage** across unit, integration, and E2E tests.

## Workflow Steps

1. **Define User Journeys** - Write stories (As a [role], I want [action], so that [benefit])
2. **Generate Test Cases** - Create comprehensive test scenarios
3. **Run Tests** - Expect failures initially (RED)
4. **Implementation** - Write minimal code to pass tests (GREEN)
5. **Verify Tests** - Confirm all pass
6. **Refactor** - Improve while maintaining test coverage (REFACTOR)
7. **Coverage Check** - Validate 80%+ threshold

## Test Categories

| Type | Scope | Tools |
|------|-------|-------|
| Unit | Functions, components, utilities | Vitest, Jest |
| Integration | APIs, databases, services | Vitest, Supertest |
| E2E | Critical user flows | Playwright |

## Organization Structure

```
src/
  components/
    Button.tsx
    Button.test.tsx    # Unit test alongside source
e2e/
  booking-flow.spec.ts # E2E tests in dedicated folder
```

## Critical Practices

- Mock external services (APIs, databases)
- Test user-visible behavior, not implementation details
- Use semantic selectors for E2E tests
- Maintain test isolation
- Run coverage reports regularly

## Philosophy

> "Tests are not optional. They are the safety net that enables confident refactoring, rapid development, and production reliability."

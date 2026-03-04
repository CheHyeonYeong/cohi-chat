# AGENTS.md

이 문서는 저장소의 공통 AI 가이드입니다.

## 규칙 우선순위

- 공통 정책과 상세 절차의 source of truth는 `CLAUDE.md`와 `.claude/rules/`입니다.
- 이 문서는 모델별 실행 최적화 가이드만 추가로 제공합니다.
- `AGENTS.md`와 `CLAUDE.md` 계열 문서가 중복되거나 충돌하면 `CLAUDE.md`와 `.claude/rules/`를 따릅니다.

## 강제 실행 규칙 (Hard Enforcement)

- 최적화 지침을 제외한 모든 실행 판단(브랜치, 커밋, 리뷰, 이슈/PR, 배포, Git 원격 작업)은 반드시 `CLAUDE.md`와 `.claude/rules/`를 따릅니다.
- `git push`, `gh pr merge` 등 원격 Git 작업은 `CLAUDE.md`/`.claude/rules/git.md` 범위에서만 수행합니다.
- `AGENTS.md`는 `CLAUDE.md` 계열 규칙을 완화하거나 우회하는 근거로 사용할 수 없습니다.

## 모델별 최적화 지침

### Codex 최적화

- 검색/탐색은 `rg` 기반으로 빠르게 수행하고, 수정 범위는 목적 단위로 최소화합니다.
- 변경은 가능한 한 작은 atomic patch로 나눕니다.
- 변경 후에는 관련 검증 명령(Backend: `./gradlew test`, Frontend: `pnpm lint && pnpm test`)을 실행합니다.

### Gemini 최적화

- Windows 환경 기준으로 PowerShell 문법을 사용합니다.
- 긴 명령 체인보다 단계별 실행을 우선해 실패 지점을 명확히 합니다.
- Claude 전용 자동 훅에 의존하지 말고 필요한 검증 명령을 명시적으로 실행합니다.

## 모델별 파일 운영

- `.codex/AGENTS.md`: Codex에만 필요한 추가 규칙이 있을 때만 작성합니다.
- `GEMINI.md`: 현재는 사용하지 않습니다. Gemini 전용 추가 규칙이 꼭 필요할 때만 생성합니다.
- 공통 규칙은 복제하지 않고 `AGENTS.md`와 `CLAUDE.md` 계열 문서를 참조합니다.
- `CODEX.md`는 폐기되었으며 사용하지 않습니다.

# GEMINI.md

Gemini CLI 전용 운영 가이드입니다. 이 프로젝트는 Claude 기반 컨벤션을 최우선으로 하며, `CLAUDE.md`를 공통 준수사항으로 따릅니다.

## 문서 및 운영 기준

- **공통 기준**: 모든 개발 정책과 스타일 가이드는 `CLAUDE.md`를 최우선으로 준수합니다.
- **작업 흐름**: 일반적인 사용 흐름은 `README.md`를 참고합니다.
- **Gemini 전용**: 이 문서(`GEMINI.md`)는 Gemini 모델이 이 프로젝트에서 가장 효율적으로 작업하기 위한 기술적 가이드를 제공합니다.

## 개발 원칙 (Gemini 전용)

- **PowerShell 최적화**: Windows 환경(`win32`)이므로 `run_shell_command` 사용 시 PowerShell 문법을 활용합니다.
- **Surgical Updates**: 코드 수정 시 `replace` 툴을 사용하여 최소한의 변경으로 정확한 위치를 수정합니다.
- **검증 중심**: 변경 사항 적용 전후로 `gradlew test` (Backend) 또는 `pnpm test` (Frontend)를 반드시 수행하여 정합성을 확인합니다.
- **컨텍스트 유지**: `.claude/` 디렉토리의 이슈 로그와 규칙(`rules/`)들을 참고하여 프로젝트의 히스토리를 이해하고 작업합니다.

## 표준 작업 절차

1. **이슈 분석**: `.claude/issue/` 또는 `gh pr view`를 통해 작업 목표를 명확히 파악합니다.
2. **브랜치 전략**: `git checkout -b {이니셜}_{이슈번호}` 형식의 브랜치에서 작업합니다.
   - `Tarte12` -> `khs`
   - `CheHyeonYeong` -> `chy`
   - `say8425` -> `bc`
3. **구현 및 로컬 검증**:
   - **Backend**: `cd backend; ./gradlew test`
   - **Frontend**: `cd frontend; pnpm lint; pnpm test`
4. **결과 보고**: `CODEX.md`의 보고 형식을 준수하여 작업 내용을 요약합니다.

## 환경 가이드

- **OS**: Windows (PowerShell)
- **Timezone**: `Asia/Seoul`
- **Backend**: Java 21 / Spring Boot 3.5
- **Frontend**: Vite / React / pnpm

## Gemini 특화 팁

- **Parallel Search**: `grep_search`와 `glob`을 병렬로 실행하여 구조를 빠르게 파악합니다.
- **Read First**: 파일 수정 전 `read_file`로 전체 컨텍스트를 먼저 확인하여 의존성을 파악합니다.
- **No Self-Reference**: 커밋 메시지나 코드 주석에 Gemini/AI 관련 내용을 포함하지 않습니다. (프로젝트 규칙 준수)

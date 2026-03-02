# GEMINI.md

Gemini CLI 전용 운영 가이드임.

## 문서 및 운영 기준

- **공통 기준**: 모든 개발 정책과 스타일 가이드는 `CLAUDE.md`를 최우선으로 따름.
- **작업 흐름**: 일반적인 사용 흐름은 `README.md`를 참고함.
- **운영 전용**: 이 문서는 Gemini 모델의 프로젝트 최적화 및 기술적 가이드를 제공함.

## 기본 원칙

- **PowerShell 활용**: Windows 환경(`win32`)에 맞춰 `run_shell_command` 시 PowerShell 문법을 사용함.
- **최소 변경 원칙**: 코드 수정 시 `replace` 툴을 사용하여 정확한 위치를 최소 단위로 수정함.
- **검증 필수**: 변경 사항 적용 전후로 Backend(`./gradlew test`) 또는 Frontend(`pnpm test`) 테스트를 수행함.
- **히스토리 준수**: `.claude/` 내의 이슈 로그와 규칙(`rules/`)을 작업 전 확인함.

## 표준 작업 절차

1. **상태 파악**: `.claude/issue/` 또는 `gh pr view`를 통해 작업 목표를 분석함.
2. **브랜치 작업**: `git checkout -b {이니셜}_{이슈번호}` 형식의 브랜치를 사용함.
   - `Tarte12` -> `khs`
   - `CheHyeonYeong` -> `chy`
   - `say8425` -> `bc`
3. **구현 및 검증**:
   - Backend: `cd backend; ./gradlew test`
   - Frontend: `cd frontend; pnpm lint; pnpm test`
4. **결과 보고**: `CODEX.md`의 보고 형식을 준수하여 요약 내용을 기록함.

## 환경 참고

- **운영체제**: Windows (PowerShell)
- **시간대**: `Asia/Seoul`
- **기술 스택**: Java 21 (Spring Boot 3.5), React (Vite/pnpm)

## 작업 팁

- **병렬 탐색**: `grep_search`와 `glob`을 병렬로 실행하여 구조를 빠르게 파악함.
- **사전 확인**: 파일 수정 전 `read_file`로 전체 컨텍스트와 의존성을 확인함.
- **AI 내용 배제**: 커밋 메시지나 코드 내에 Gemini/AI 관련 언급을 포함하지 않음.

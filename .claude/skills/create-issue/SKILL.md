# GitHub 이슈 자동 생성

> GitHub 이슈를 템플릿 기반으로 자동 생성하는 skill

## 사용법

```text
/create-issue {제목}
```

**이슈 제목**: $ARGUMENTS

## 작업 순서

1. **템플릿 선택**: `.github/ISSUE_TEMPLATE/` 에서 적합한 템플릿 확인
   - `feature.md`: 새로운 기능 개발
   - `bug.md`: 버그 수정
   - `refactoring.md`: 코드 리팩토링

2. **이슈 정보 수집**: 사용자에게 필요한 정보 질문
   - 이슈 타입 (feature/bug/refactoring)
   - Assignee (담당자)
   - Milestone
   - Labels
   - 상세 내용

3. **이슈 생성**: `gh issue create` 명령어로 이슈 생성

## 이슈 생성 명령어

```bash
gh issue create \
  --title "[TYPE] 제목" \
  --label "label1" \
  --assignee "username" \
  --milestone "milestone-title" \
  --body "본문 내용"
```

## 템플릿별 필수 섹션

### Feature
- 🎯 목표 (What & Why)
- 📦 구체적으로 뭘 만들지 (Deliverables)
- 🚫 다음에 할 일 (Out of Scope)
- ✅ 체크포인트 (Check Point)

### Bug
- 버그 설명
- 재현 방법
- 기대 동작
- 환경 정보

### Refactoring
- 🎯 목표 (What & Why)
- 📦 구체적으로 뭘 바꿀지 (Deliverables)
- 기대 효과
- ✅ 체크포인트 (Check Point)

## 필수 확인 명령어

이슈 생성 전 반드시 아래 명령어로 정보를 확인:

```bash
# Labels 확인 (필수)
gh label list

# Milestones 확인 (필수)
gh api repos/:owner/:repo/milestones --jq ".[] | {number, title}"

# Collaborators 확인 (assignee 지정 시)
gh api repos/:owner/:repo/collaborators --jq ".[].login"

# Projects 확인 (필수)
gh project list
```

## 이슈를 Project에 추가

```bash
# 이슈 생성 후 프로젝트에 추가
gh project item-add {PROJECT_NUMBER} --owner {OWNER} --url {ISSUE_URL}
```

## 작업 산정 기준

이슈 생성 시 Project 필드에 아래 기준으로 값을 설정:

### Priority (우선순위)
| 값 | 설명 |
|----|------|
| P0 | 지금 안 하면 장애 / 일정 붕괴 |
| P1 | 이번 스프린트에 반드시 필요 |
| P2 | 하면 좋은데 밀려도 됨 |
| P3 | 백로그용 |

### Size (작업 크기)
| 값 | 설명 |
|----|------|
| S | 반나절~1일 |
| M | 1~2일 |
| L | 3~5일 |
| XL | 쪼개야 함 (설계 다시) |

### Estimate (예상 소요)
- 단위: 개발자 작업일 기준 (0.5d / 1d / 2d / 3d)
- Size는 "감각", Estimate는 "약속용 수치"

### Start date / Target date
- Start date: 실제 착수일 (YYYY-MM-DD)
- Target date: 리뷰 + QA 포함 완료 목표일 (YYYY-MM-DD)

## 주의사항

- `--milestone` 옵션에는 milestone **title**을 사용 (number 아님)
- `--label` 옵션에는 정확한 label 이름 사용 (대소문자 구분)
- Project 권한 필요 시: `gh auth refresh -s read:project -s project`

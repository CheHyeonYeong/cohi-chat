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

> **본문 형식**: @.claude/rules/issues.md 규칙을 따른다.

## 이슈 생성 명령어

```bash
gh issue create \
  --title "[TYPE] 제목" \
  --label "label1" \
  --assignee "username" \
  --milestone "milestone-title" \
  --body "본문 내용"
```

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

## 이슈를 Project에 추가 및 필드 설정

### 1단계: 프로젝트에 이슈 추가

```bash
gh project item-add {PROJECT_NUMBER} --owner {OWNER} --url {ISSUE_URL}
```

### 2단계: 프로젝트 정보 조회

```bash
# 프로젝트 목록 및 ID 확인
gh project list --owner {OWNER}

# 프로젝트 필드 ID 및 옵션 ID 조회
gh project field-list {PROJECT_NUMBER} --owner {OWNER} --format json
```

### 3단계: 프로젝트 아이템 ID 조회

```bash
gh api graphql -f query='
  query {
    user(login: "{OWNER}") {
      projectV2(number: {PROJECT_NUMBER}) {
        items(last: 5) {
          nodes {
            id
            content {
              ... on Issue { number }
            }
          }
        }
      }
    }
  }
'
```

### 4단계: 필드 값 설정

```bash
# Single Select 필드 (Priority, Size, Status 등)
gh project item-edit --project-id {PROJECT_ID} --id {ITEM_ID} \
  --field-id {FIELD_ID} --single-select-option-id {OPTION_ID}

# Number 필드 (Estimate)
gh project item-edit --project-id {PROJECT_ID} --id {ITEM_ID} \
  --field-id {FIELD_ID} --number {VALUE}

# Date 필드 (Start date, Target date)
gh project item-edit --project-id {PROJECT_ID} --id {ITEM_ID} \
  --field-id {FIELD_ID} --date {YYYY-MM-DD}
```

## 작업 산정 기준

이슈 생성 시 사용자에게 아래 기준으로 Priority, Size를 질문하고 Project 필드에 설정:

### Priority (우선순위)
| 값 | 설명 |
|----|------|
| P0 | 지금 안 하면 장애 / 일정 붕괴 |
| P1 | 이번 스프린트에 반드시 필요 |
| P2 | 하면 좋은데 밀려도 됨 |

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

## 작업 순서 요약

1. 이슈 생성 (`gh issue create`)
2. 프로젝트에 추가 (`gh project item-add`)
3. 아이템 ID 조회 (GraphQL)
4. Priority, Size 등 필드 설정 (`gh project item-edit`)

## 주의사항

- `--milestone` 옵션에는 milestone **title**을 사용 (number 아님)
- `--label` 옵션에는 정확한 label 이름 사용 (대소문자 구분)
- Project 권한 필요 시: `gh auth refresh -s read:project -s project`
- 필드 ID와 옵션 ID는 프로젝트마다 다르므로 반드시 조회 후 사용

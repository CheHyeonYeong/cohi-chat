# GitHub 이슈 자동 생성

> GitHub 이슈를 템플릿 기반으로 자동 생성하는 skill

## 사용법

```
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
```

## 주의사항

- `--milestone` 옵션에는 milestone **title**을 사용 (number 아님)
- `--label` 옵션에는 정확한 label 이름 사용 (대소문자 구분)

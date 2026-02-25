### 이슈 생성 시 템플릿 규칙

이슈를 생성할 때 반드시 유형에 맞는 템플릿을 읽고 그 형식을 따라야 한다.

- Feature: @.github/ISSUE_TEMPLATE/feature.md
- Bug: @.github/ISSUE_TEMPLATE/bug.md
- Refactoring: @.github/ISSUE_TEMPLATE/refactoring.md

#### 규칙

- 템플릿의 모든 섹션을 포함해야 한다 (해당 없는 섹션은 "N/A" 또는 "해당 없음" 기재)
- 템플릿의 섹션 순서를 변경하지 않는다
- 템플릿에 없는 임의 섹션을 추가하지 않는다
- `gh label list`로 label 목록을 확인하고 이슈 내용에 맞는 label을 선택한다
- 이슈 생성 후 프로젝트에 추가한다: `gh project item-add 6 --owner CheHyeonYeong --url {ISSUE_URL}`
- 활성 마일스톤을 조회하고 적절한 마일스톤을 지정한다: `gh api repos/:owner/:repo/milestones --jq '.[] | select(.state=="open")'`
- @.claude/rules/work-estimation.md 기준에 따라 작업산정(Priority/Size/Estimate/Start date/Target date)을 사용자에게 질문하고 프로젝트 필드에 설정한다

### PR 생성 시 템플릿 규칙

PR을 생성할 때 반드시 아래 템플릿을 읽고 그 형식을 따라야 한다.

@.github/PULL_REQUEST_TEMPLATE.md

#### 규칙

- 템플릿의 모든 섹션을 포함해야 한다 (해당 없는 섹션은 "N/A" 또는 "해당 없음" 기재)
- 템플릿의 섹션 순서를 변경하지 않는다
- 템플릿에 없는 임의 섹션을 추가하지 않는다
- `--assignee @me`로 자기 자신을 assign 한다
- `gh label list`로 label 목록을 확인하고 PR 내용에 맞는 label을 선택한다
- PR 생성 후 프로젝트에 추가한다: `gh project item-add 6 --owner CheHyeonYeong --url {PR_URL}`

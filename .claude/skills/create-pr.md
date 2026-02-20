# GitHub PR 자동 생성

> GitHub Pull Request를 자동으로 생성하는 skill

## 사용법

```
/create-pr
```

## 작업 순서

1. **현재 상태 확인**
   ```bash
   git status                    # 변경 사항 확인
   git diff                      # 상세 변경 내용
   git log main..HEAD --oneline  # 커밋 히스토리
   ```

2. **브랜치 푸시** (필요시)
   ```bash
   git push -u origin {branch-name}
   ```

3. **PR 생성**
   ```bash
   gh pr create --title "제목" --body "본문"
   ```

## PR 본문 형식

```markdown
## Summary
- 변경 사항 요약 (1-3 bullet points)

## Related Issue
- Closes #{이슈번호}

## Test plan
- [ ] 테스트 항목 1
- [ ] 테스트 항목 2

## Screenshots (해당시)
<!-- 스크린샷 첨부 -->
```

## PR 생성 명령어

```bash
gh pr create \
  --title "feat: 기능 설명" \
  --body "$(cat <<'EOF'
## Summary
- 변경 사항 요약

## Related Issue
- Closes #123

## Test plan
- [ ] 테스트 완료
EOF
)"
```

## PR 제목 규칙

| Prefix | 설명 |
|--------|------|
| feat: | 새로운 기능 |
| fix: | 버그 수정 |
| refactor: | 리팩토링 |
| docs: | 문서 수정 |
| test: | 테스트 추가 |
| chore: | 빌드, 설정 등 |

## 필수 확인 명령어

PR 생성 전 반드시 아래 명령어로 정보를 확인:

```bash
# Labels 확인 (필수)
gh label list

# Milestones 확인 (필수)
gh api repos/:owner/:repo/milestones --jq ".[] | {number, title}"

# Projects 확인 (필수)
gh project list
```

## PR 생성 후 label/milestone/project 추가

```bash
# label, milestone 추가
gh pr edit {number} --add-label "Label명" --milestone "milestone title"

# PR을 프로젝트에 추가
gh project item-add {PROJECT_NUMBER} --owner {OWNER} --url {PR_URL}
```

## 유용한 명령어

```bash
# PR 상태 확인
gh pr status

# PR 목록 보기
gh pr list

# PR 상세 보기
gh pr view {number}

# Draft PR 생성
gh pr create --draft
```

## 주의사항

- `--milestone` 옵션에는 milestone **title**을 사용 (number 아님)
- `--label` 옵션에는 정확한 label 이름 사용 (대소문자 구분)
- Project 권한 필요 시: `gh auth refresh -s read:project -s project`

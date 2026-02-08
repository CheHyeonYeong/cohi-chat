## TDD 기반 이슈 개발

1. **이슈 할당**: 사용자가 `chy_{number}` or `khs_{number}` 형식으로 이슈 번호 제공
2. **브랜치 생성**: 사용자가 제공한 `chy_{number}` or `khs_{number}` 형식으로 브랜치 생성
3. **이슈 확인**: GitHub 이슈 조회 → `https://github.com/CheHyeonYeong/cohi-chat/issues/{number}`
4. **실행 계획 작성**: `.claude/issue/{number}.md`에 checkpoint 단위로 계획 작성
5. **순차 작업**: 작성된 계획 파일을 보면서 checkpoint 순서대로 진행
6. **TDD 사이클**: 테스트 작성 → 실패 확인 → 구현 → 테스트 통과 → 리팩토링

## 실행 계획 파일 형식 (`.claude/issue/{number}.md`)

```markdown
# Issue #{number}: {제목}

## 체크포인트

### CP1: {단계명}
- [ ] 작업 내용
- [ ] 테스트 작성
- [ ] 구현

### CP2: {단계명}
- [ ] 작업 내용
...
```
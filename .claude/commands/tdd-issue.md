## TDD 기반 이슈 개발

**이슈 번호**: $ARGUMENTS

> `$ARGUMENTS`는 이 명령어 실행 시 전달된 이슈 번호입니다. (예: `/issue 184` → `$ARGUMENTS`=`184`)

### 작업 순서

1. **브랜치 생성**: `{작성자이니셜}_$ARGUMENTS` 형식으로 브랜치 생성 (예: `khs_82`, `chy_82`)
2. **이슈 확인**: GitHub 이슈 조회 → `https://github.com/CheHyeonYeong/cohi-chat/issues/{number}`
3. **실행 계획 작성**: `.claude/issue/{number}.md`에 checkpoint 단위로 계획 작성
4. **순차 작업**: 작성된 계획 파일을 보면서 checkpoint 순서대로 진행
5. **TDD 사이클**: 테스트 작성 → 실패 확인 → 구현 → 테스트 통과 → 리팩토링

### 실행 계획 파일 형식 (`.claude/issue/{number}.md`)

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

### 시작하기

이슈 번호 `$ARGUMENTS`에서 숫자를 추출하여 위 작업을 순서대로 진행해주세요.

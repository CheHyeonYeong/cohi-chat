# TDD 기반 이슈 개발

> GitHub 이슈를 TDD 방식으로 개발하는 워크플로우

## 사용법

```text
/tdd-issue {이슈번호}
```

**이슈 번호**: $ARGUMENTS

## 작업 순서

1. **브랜치 생성**: `{작성자이니셜}_$ARGUMENTS` 형식으로 브랜치 생성 (예: `khs_82`, `chy_82`)
2. **이슈 확인**: GitHub CLI(`gh issue view $ARGUMENTS`)를 통해 이슈 내용 확인
3. **실행 계획 작성**: `.claude/issue/$ARGUMENTS.md`에 checkpoint 단위로 계획 작성
4. **순차 작업**: 작성된 계획 파일을 보면서 checkpoint 순서대로 진행
5. **TDD 사이클**: 테스트 작성 → 실패 확인 → 구현 → 테스트 통과 → 리팩토링

## 실행 계획 파일 형식

`.claude/issue/{number}.md` 파일을 아래 형식으로 작성:

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

### 예시: Issue #123 - 사용자 프로필 조회 API 구현

```markdown
# Issue #123: 사용자 프로필 조회 API 구현

## 체크포인트

### CP1: Repository 계층
- [ ] MemberRepository에 findByEmail 메서드 추가
- [ ] 테스트: MemberRepositoryTest.findByEmail_존재하는_이메일_조회_성공
- [ ] 테스트: MemberRepositoryTest.findByEmail_존재하지_않는_이메일_Optional_empty

### CP2: Service 계층
- [ ] MemberService.getProfile(email) 메서드 구현
- [ ] 테스트: MemberServiceTest.getProfile_정상조회
- [ ] 테스트: MemberServiceTest.getProfile_회원없음_예외발생

### CP3: Controller 계층
- [ ] GET /api/members/profile 엔드포인트 추가
- [ ] 테스트: MemberControllerTest.getProfile_인증된_사용자_200
- [ ] 테스트: MemberControllerTest.getProfile_미인증_401
```

## TDD 사이클

| 단계 | 설명 |
|------|------|
| RED | 실패하는 테스트 작성 |
| GREEN | 테스트 통과하는 최소 코드 작성 |
| REFACTOR | 코드 개선 (테스트 유지) |

### 각 단계별 코드 예시

#### RED: 실패하는 테스트 작성

```java
// MemberServiceTest.java
@Test
@DisplayName("프로필 조회 - 정상 케이스")
void getProfile_정상조회() {
    // given
    String email = "test@example.com";
    Member member = Member.builder()
        .email(email)
        .nickname("테스터")
        .build();
    when(memberRepository.findByEmail(email))
        .thenReturn(Optional.of(member));

    // when
    MemberProfileResponseDTO response = memberService.getProfile(email);

    // then
    assertThat(response.getEmail()).isEqualTo(email);
    assertThat(response.getNickname()).isEqualTo("테스터");
}
```

```typescript
// ProfilePage.test.tsx
describe('ProfilePage', () => {
  it('사용자 프로필을 정상적으로 표시한다', async () => {
    // given
    const mockProfile = {
      email: 'test@example.com',
      nickname: '테스터'
    };
    server.use(
      http.get('/api/members/profile', () => {
        return HttpResponse.json(mockProfile);
      })
    );

    // when
    render(<ProfilePage />);

    // then
    expect(await screen.findByText('테스터')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();

    // data-testid 활용 예시
    expect(screen.getByTestId('profile-nickname')).toHaveTextContent('테스터');
    expect(screen.getByTestId('profile-email')).toHaveTextContent('test@example.com');
  });
});
```

#### GREEN: 테스트 통과하는 최소 코드 작성

```java
// MemberService.java
public MemberProfileResponseDTO getProfile(String email) {
    Member member = memberRepository.findByEmail(email)
        .orElseThrow(() -> new MemberNotFoundException(email));

    return MemberProfileResponseDTO.builder()
        .email(member.getEmail())
        .nickname(member.getNickname())
        .build();
}
```

```typescript
// ProfilePage.tsx
export function ProfilePage() {
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/api/members/profile').then(res => res.data)
  });

  if (!profile) return <Loading />;

  return (
    <div>
      <p>{profile.nickname}</p>
      <p>{profile.email}</p>
    </div>
  );
}
```

#### REFACTOR: 코드 개선 (테스트 유지)

```java
// MemberService.java - 리팩토링 후
public MemberProfileResponseDTO getProfile(String email) {
    return memberRepository.findByEmail(email)
        .map(this::toProfileResponse)
        .orElseThrow(() -> new MemberNotFoundException(email));
}

private MemberProfileResponseDTO toProfileResponse(Member member) {
    return MemberProfileResponseDTO.from(member);  // 정적 팩토리 메서드 활용
}
```

```typescript
// hooks/useProfile.ts - 커스텀 훅으로 분리
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile
  });
}

// ProfilePage.tsx - 리팩토링 후
export function ProfilePage() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) return <Loading />;

  return <ProfileCard profile={profile} />;
}
```

## 시작하기

이슈 번호 `$ARGUMENTS`에서 숫자를 추출하여 위 작업을 순서대로 진행해주세요.

### useAuth() 로그인 체크 규칙
- 단순 로그인 여부 확인에는 `isAuthenticated`를 사용한다
  - Good: `const { isAuthenticated } = useAuth();` → `if (!isAuthenticated) ...`
  - Bad: `const { data: user } = useAuth();` → `if (!user) ...` / `if (!!user) ...`
- `data: user`는 user 객체의 속성(displayName, username, isHost 등)에 접근할 때만 destructure한다
- 기존 패턴 참고: `Header`, `Home`, `AuthGuard` 등에서 `isAuthenticated` 사용 중

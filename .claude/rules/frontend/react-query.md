### React Query (TanStack Query) 사용 규칙

- API 호출은 반드시 TanStack Query (`useQuery`, `useMutation`)로 감싼다
- 컴포넌트 내부에서 `useState` + `useEffect`로 직접 API 상태 관리 금지
  - Good: `const { data, isLoading } = useQuery({ queryKey: [...], queryFn: fetchXxx })`
  - Bad: `const [data, setData] = useState(null); useEffect(() => { fetch(...).then(setData) }, [])`
- API 호출 로직은 `features/{domain}/hooks/` 아래 커스텀 훅으로 분리한다
- `queryKey`는 `features/{domain}/hooks/queryKeys.ts`에 정의된 key factory를 사용한다
  - Good: `queryClient.invalidateQueries({ queryKey: bookingKeys.allMyBookingsAll() })`
  - Bad: `queryClient.invalidateQueries({ queryKey: ['all-my-bookings'] })`
  - prefix 매칭용 key는 `xxxAll: () => ['key-prefix'] as const` 패턴으로 별도 정의
  - 페이지네이션 key는 `xxx: (page, pageSize) => ['key-prefix', page, pageSize] as const` 패턴
- 뮤테이션 성공 후 관련 쿼리는 `queryClient.invalidateQueries()`로 무효화한다
  - 연관된 모든 목록 쿼리를 빠짐없이 무효화 (예: 개별 목록 + 통합 목록 모두)
- `placeholderData: keepPreviousData` 사용 시 주의사항
  - 쿼리 키 변경 시 이전 데이터가 잠시 유지되므로, 데이터의 ID와 현재 선택값이 일치하는지 반드시 확인
  - Good: `selectedId && data && data.id === selectedId`
  - Bad: `selectedId && data` (이전 데이터가 잘못 표시될 수 있음)

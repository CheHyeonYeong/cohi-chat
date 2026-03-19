### React Query (TanStack Query) 사용 규칙

- API 호출은 반드시 TanStack Query (`useQuery`, `useMutation`)로 감싼다
- 컴포넌트 내부에서 `useState` + `useEffect`로 직접 API 상태 관리 금지
  - Good: `const { data, isLoading } = useQuery({ queryKey: [...], queryFn: fetchXxx })`
  - Bad: `const [data, setData] = useState(null); useEffect(() => { fetch(...).then(setData) }, [])`
- API 호출 로직은 `features/{domain}/hooks/` 아래 커스텀 훅으로 분리한다
- `queryKey`는 `features/{domain}/hooks/queryKeys.ts`에 모아서 관리한다
- 뮤테이션 성공 후 관련 쿼리는 `queryClient.invalidateQueries()`로 무효화한다

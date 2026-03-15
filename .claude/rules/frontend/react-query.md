# React Query API 래핑 규칙

## 원칙

모든 API 호출은 React Query(`@tanstack/react-query`)로 감싸야 합니다. 컴포넌트나 페이지에서 API 함수를 직접 호출하지 마세요.

## 규칙

### 변경(Mutation) API — `useMutation`으로 래핑

서버 상태를 변경하는 API(POST, PUT, PATCH, DELETE, 외부 URL 조회 후 리다이렉트 등)는 반드시 커스텀 훅으로 분리하고 `useMutation`을 사용하세요.

```typescript
// ❌ 잘못된 예 — 컴포넌트에서 API 직접 호출 + 수동 상태 관리
const [isPending, setIsPending] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleSubmit = async () => {
    setIsPending(true);
    try {
        await someApi(params);
    } catch (e) {
        setError('실패했습니다.');
    } finally {
        setIsPending(false);
    }
};

// ✅ 올바른 예 — useMutation 훅으로 분리
// hooks/useSomething.ts
export function useSomething(): UseMutationResult<...> {
    return useMutation({ mutationFn: someApi });
}

// 컴포넌트
const mutation = useSomething();
mutation.mutate(params, { onSuccess: () => { /* ... */ } });
// isPending, isError, error는 mutation에서 직접 사용
```

### 조회(Query) API — `useQuery`로 래핑

서버 상태를 읽는 API(GET)는 커스텀 훅으로 분리하고 `useQuery`를 사용하세요.

```typescript
// ❌ 잘못된 예
const [data, setData] = useState(null);
useEffect(() => { fetchData().then(setData); }, []);

// ✅ 올바른 예
export function useSomeData(id: string) {
    return useQuery({ queryKey: ['someData', id], queryFn: () => fetchData(id) });
}
```

### 커스텀 훅 위치

- `features/{domain}/hooks/` 디렉터리에 파일 1개당 훅 1개 원칙으로 작성합니다.
- `features/{domain}/hooks/index.ts` 배럴 파일에 반드시 export를 추가합니다.
- 훅 파일명은 `use{동작}{대상}.ts` 형식을 따릅니다 (예: `useCreateBooking.ts`, `useOAuthAuthorizationUrl.ts`).

### 로딩·에러 상태

- 로딩 상태: `mutation.isPending` / `query.isLoading`을 사용하고, `useState`로 별도 관리하지 마세요.
- 에러 상태: `mutation.isError` / `mutation.error`를 사용하고, `useState`로 별도 관리하지 마세요.
- 에러 메시지 표시: `getErrorMessage(error, '기본 메시지')` 유틸리티를 활용하세요.

### console.error 금지

`onError` 콜백에서 `console.error`를 호출하지 마세요. 예상 가능한 실패(인증 오류, 유효성 오류 등)는 UI로만 안내합니다.

```typescript
// ❌ 금지
onError: (error) => { console.error('error:', error); }
```
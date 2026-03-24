### 에러 메시지 표시 규칙
- 사용자에게 에러를 표시할 때 반드시 `getErrorMessage()` 사용 (`~/libs/errorUtils`)
- `error.message` 직접 렌더링 금지 — 5xx 서버 에러 시 내부 정보(DB 스키마, 스택트레이스 등) 노출 위험
  - Good: `<p>{getErrorMessage(error)}</p>`
  - Bad: `<p>{error.message}</p>`
  - Bad: `<p>{(error as Error).message}</p>`
- `getErrorMessage`는 5xx일 때 자동으로 generic fallback을 반환하고, 4xx는 서버 메시지를 그대로 전달
- HTTP 상태 코드 확인: `isHttpError(error, 404)` 사용 (`~/libs/errorUtils`)

### `getErrorMessage(error, fallback?)` 동작 규칙

```
getErrorMessage(error: unknown, fallback?: string): string
```

우선순위에 따라 적절한 에러 메시지를 반환한다:

1. **네트워크 에러** (Failed to fetch, NetworkError, Load failed): "네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요."
2. **5xx 에러** (error.cause >= 500): 서버 메시지를 무시하고 상태 코드별 generic 메시지 반환
   - 500 → "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
   - 503 → "서버 점검 중입니다. 잠시 후 다시 시도해주세요."
   - 매핑 없는 5xx → fallback (기본: "알 수 없는 오류가 발생했습니다.")
3. **4xx 에러**: 서버가 보낸 메시지를 그대로 반환 (ErrorCode에 정의된 사용자 친화적 메시지)
   - 예: 409 → "중복된 계정 ID입니다."
4. **서버 메시지 없음** ("HTTP error! status: NNN" 패턴): 상태 코드별 기본 메시지 반환
5. **그 외**: fallback 반환

### `isHttpError(error, status)` 동작 규칙

```
isHttpError(error: unknown, status: number): boolean
```

- `error.cause`가 지정한 HTTP 상태 코드와 일치하면 `true`
- 용도: 특정 상태 코드에 따른 UI 분기 (예: 401이면 로그인 링크 표시, 404이면 빈 상태 표시)

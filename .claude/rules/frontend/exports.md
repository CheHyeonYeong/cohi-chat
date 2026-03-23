### Export 규칙
- 모든 소스 파일은 named export만 사용한다 (`export function X`, `export const X`)
- `export default` 사용 금지
- import 시 `import { X } from '~/...'` 형태 사용
- `import X from '~/...'` 형태 금지 (default import 금지)
- `forwardRef` 컴포넌트도 `export const X = forwardRef<...>(...)` 형태로 직접 선언
- 별도 `X.displayName = "X"` 할당 금지 (변수명에서 자동 추론)
- `const X = forwardRef(...); export { X };` 패턴 금지

### React 타입 import 규칙
- `React.` namespace prefix 사용 금지 → `react`에서 직접 named import
  - Good: `import type { ReactNode, FormEvent } from 'react'`
  - Bad: `React.ReactNode`, `React.FormEvent`
- `React.createElement` 금지 → JSX 사용 (테스트 mock 포함)
  - Good: `<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>`
  - Bad: `React.createElement(QueryClientProvider, { client: queryClient }, children)`
- `React.FC` 사용 금지 → 일반 함수 선언에 props 타입 직접 명시
  - Good: `function Pagination({ page }: PaginationProps) {`
  - Bad: `const Pagination: React.FC<PaginationProps> = ({ page }) => {`

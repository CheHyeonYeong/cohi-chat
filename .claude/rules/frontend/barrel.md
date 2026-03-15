### Barrel Import 규칙
- 각 디렉토리에 `index.ts` barrel 파일을 유지한다
- 외부에서 디렉토리 내부 파일을 직접 import하지 않는다
  - Good: `import { Button } from '~/components/button'`
  - Bad: `import { Button } from '~/components/button/Button'`
- barrel 파일에서 `export { default as X }` 사용 금지 → `export { X }` 사용
- 예외: 테스트 파일에서는 mock 설정을 위해 내부 경로 직접 import 허용
- 예외: `LinkButton`은 모듈 최상위에서 `createLink()`를 호출하여 barrel export 시 부작용 발생 → 직접 import 사용 (`~/components/button/LinkButton`)

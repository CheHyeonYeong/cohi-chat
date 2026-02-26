### 테스트 셀렉터 규칙

- 테스트에서 요소를 선택할 때 CSS 클래스(`.cursor-pointer`, `.text-xs` 등)를 셀렉터로 사용 금지
- 반드시 `data-testid` 속성을 사용하여 요소를 선택한다
- 컴포넌트에 `data-testid`가 없으면 컴포넌트 소스에 추가한 후 테스트 작성
- Testing Library 쿼리 우선순위: `getByRole` > `getByText` > `getByTestId` > `querySelector('[data-testid="..."]')`
- 참고: [Testing Library Queries Priority](https://testing-library.com/docs/queries/about/#priority)

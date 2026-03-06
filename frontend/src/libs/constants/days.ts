/**
 * 요일 인덱싱 규칙 (JavaScript Date.getDay() 기준)
 *
 * | 인덱스 | 요일 |
 * |--------|------|
 * | 0      | 일   |
 * | 1      | 월   |
 * | 2      | 화   |
 * | 3      | 수   |
 * | 4      | 목   |
 * | 5      | 금   |
 * | 6      | 토   |
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getDay
 */

/** JavaScript Date.getDay()가 반환하는 요일 인덱스 (0=일 ~ 6=토) */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** 주간 그리드 컬럼 인덱스 (0=월 ~ 6=일) */
export type GridColumn = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * 요일 선택 UI에서 사용하는 요일 목록
 * 일요일(0)부터 토요일(6)까지 순서대로 정렬
 */
export const WEEKDAYS = [
    { label: '일', value: 0 },
    { label: '월', value: 1 },
    { label: '화', value: 2 },
    { label: '수', value: 3 },
    { label: '목', value: 4 },
    { label: '금', value: 5 },
    { label: '토', value: 6 },
] as const;

/**
 * 요일 인덱스를 한글 레이블로 매핑
 * @example DAY_NAMES[0] // '일'
 * @example DAY_NAMES[1] // '월'
 */
export const DAY_NAMES: Record<Weekday, string> = {
    0: '일',
    1: '월',
    2: '화',
    3: '수',
    4: '목',
    5: '금',
    6: '토',
};

/**
 * 주간 스케줄 그리드에서 사용하는 요일 레이블 (월요일 시작)
 */
export const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'] as const;

/**
 * 요일 인덱스(0~6)를 주간 그리드 컬럼(0~6)으로 매핑
 * 그리드는 월요일(1)을 첫 번째 열(0)로 표시
 *
 * @example WEEKDAY_TO_COLUMN[1] // 0 (월요일 -> 첫 번째 열)
 * @example WEEKDAY_TO_COLUMN[0] // 6 (일요일 -> 마지막 열)
 */
export const WEEKDAY_TO_COLUMN: Record<Weekday, GridColumn> = {
    1: 0, // 월
    2: 1, // 화
    3: 2, // 수
    4: 3, // 목
    5: 4, // 금
    6: 5, // 토
    0: 6, // 일
};

/**
 * 주간 그리드 컬럼(0~6)을 요일 인덱스(0~6)로 매핑 (WEEKDAY_TO_COLUMN의 역방향)
 * 그리드 첫 번째 열(0)이 월요일(1)에 해당
 *
 * @example COLUMN_TO_WEEKDAY[0] // 1 (첫 번째 열 -> 월요일)
 * @example COLUMN_TO_WEEKDAY[6] // 0 (마지막 열 -> 일요일)
 */
export const COLUMN_TO_WEEKDAY: Record<GridColumn, Weekday> = Object.fromEntries(
    Object.entries(WEEKDAY_TO_COLUMN).map(([k, v]) => [v, Number(k)]),
) as Record<GridColumn, Weekday>;

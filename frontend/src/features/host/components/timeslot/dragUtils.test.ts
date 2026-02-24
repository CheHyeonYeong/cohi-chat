/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest';
import { parseCellId, rowToTime, computeEntryFromDrag } from './dragUtils';

describe('parseCellId', () => {
    it('유효한 cell ID를 파싱해야 한다', () => {
        expect(parseCellId('cell-0-0')).toEqual({ col: 0, row: 0 });
        expect(parseCellId('cell-6-15')).toEqual({ col: 6, row: 15 });
        expect(parseCellId('cell-3-7')).toEqual({ col: 3, row: 7 });
    });

    it('유효하지 않은 ID는 null을 반환해야 한다', () => {
        expect(parseCellId('invalid')).toBeNull();
        expect(parseCellId('cell-')).toBeNull();
        expect(parseCellId('')).toBeNull();
    });
});

describe('rowToTime', () => {
    it('row 0은 startHour:00을 반환해야 한다', () => {
        expect(rowToTime(0, 8)).toBe('08:00');
        expect(rowToTime(0, 9)).toBe('09:00');
    });

    it('홀수 row는 30분을 반환해야 한다', () => {
        expect(rowToTime(1, 8)).toBe('08:30');
        expect(rowToTime(3, 8)).toBe('09:30');
    });

    it('row 2n은 startHour + n 시간을 반환해야 한다', () => {
        expect(rowToTime(2, 8)).toBe('09:00');
        expect(rowToTime(4, 8)).toBe('10:00');
        expect(rowToTime(28, 8)).toBe('22:00');
    });

    it('두 자리 시간을 올바르게 패딩해야 한다', () => {
        expect(rowToTime(0, 8)).toBe('08:00');
        expect(rowToTime(0, 22)).toBe('22:00');
    });
});

describe('computeEntryFromDrag', () => {
    // COL_TO_WEEKDAY: 0→월(1), 1→화(2), 2→수(3), 3→목(4), 4→금(5), 5→토(6), 6→일(0)
    const START_HOUR = 8;

    it('단일 셀 드래그는 30분 슬롯 entry를 생성해야 한다', () => {
        const entry = computeEntryFromDrag('cell-0-0', 'cell-0-0', START_HOUR);
        expect(entry).not.toBeNull();
        expect(entry!.weekdays).toEqual([1]); // col 0 = 월요일
        expect(entry!.startTime).toBe('08:00');
        expect(entry!.endTime).toBe('08:30');
    });

    it('같은 열에서 위→아래 드래그는 시간 범위를 계산해야 한다', () => {
        const entry = computeEntryFromDrag('cell-0-0', 'cell-0-3', START_HOUR);
        expect(entry).not.toBeNull();
        expect(entry!.weekdays).toEqual([1]); // 월요일만
        expect(entry!.startTime).toBe('08:00');
        expect(entry!.endTime).toBe('10:00'); // row 0~3 → 08:00~10:00 (row 4 = 10:00)
    });

    it('역방향 드래그 (아래→위)도 올바르게 처리해야 한다', () => {
        const entry = computeEntryFromDrag('cell-0-3', 'cell-0-0', START_HOUR);
        expect(entry).not.toBeNull();
        expect(entry!.startTime).toBe('08:00');
        expect(entry!.endTime).toBe('10:00');
    });

    it('여러 열에 걸친 드래그는 해당 요일들을 포함해야 한다', () => {
        // col 0(월)~col 2(수) 드래그
        const entry = computeEntryFromDrag('cell-0-0', 'cell-2-3', START_HOUR);
        expect(entry).not.toBeNull();
        expect(entry!.weekdays).toEqual([1, 2, 3]); // 월, 화, 수
        expect(entry!.startTime).toBe('08:00');
        expect(entry!.endTime).toBe('10:00');
    });

    it('역방향 열 드래그 (오른쪽→왼쪽)도 올바르게 처리해야 한다', () => {
        const entry = computeEntryFromDrag('cell-2-0', 'cell-0-3', START_HOUR);
        expect(entry).not.toBeNull();
        expect(entry!.weekdays).toEqual([1, 2, 3]); // 월, 화, 수 (오름차순)
    });

    it('일요일(col 6)을 포함한 드래그를 처리해야 한다', () => {
        const entry = computeEntryFromDrag('cell-6-0', 'cell-6-1', START_HOUR);
        expect(entry).not.toBeNull();
        expect(entry!.weekdays).toEqual([0]); // 일요일 = 0
    });

    it('유효하지 않은 ID가 있으면 null을 반환해야 한다', () => {
        expect(computeEntryFromDrag('invalid', 'cell-0-0', START_HOUR)).toBeNull();
        expect(computeEntryFromDrag('cell-0-0', 'invalid', START_HOUR)).toBeNull();
    });
});

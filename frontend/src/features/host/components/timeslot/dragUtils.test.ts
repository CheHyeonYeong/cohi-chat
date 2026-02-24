import { describe, it, expect } from 'vitest';
import { parseCellId, rowToTime, computeEntryFromDrag, computeDragHighlights, isDuplicateEntry } from './dragUtils';
import type { TimeSlotEntry } from './TimeSlotForm';

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

describe('computeDragHighlights', () => {
    it('dragStartId가 null이면 빈 Set을 반환해야 한다', () => {
        expect(computeDragHighlights(null, null).size).toBe(0);
    });

    it('dragOverId가 null이면 시작 셀만 하이라이트해야 한다', () => {
        const result = computeDragHighlights('cell-1-2', null);
        expect(result).toEqual(new Set(['1-2']));
    });

    it('직사각형 드래그 범위의 모든 셀을 반환해야 한다', () => {
        const result = computeDragHighlights('cell-0-0', 'cell-1-1');
        expect(result).toEqual(new Set(['0-0', '0-1', '1-0', '1-1']));
    });

    it('역방향 드래그도 동일한 범위를 반환해야 한다', () => {
        const forward = computeDragHighlights('cell-0-0', 'cell-2-3');
        const backward = computeDragHighlights('cell-2-3', 'cell-0-0');
        expect(forward).toEqual(backward);
    });

    it('유효하지 않은 ID는 빈 Set을 반환해야 한다', () => {
        expect(computeDragHighlights('invalid', 'cell-0-0').size).toBe(0);
    });
});

describe('isDuplicateEntry', () => {
    const base: TimeSlotEntry = { weekdays: [1, 2, 3], startTime: '09:00', endTime: '18:00' };

    it('동일한 entry가 있으면 true를 반환해야 한다', () => {
        expect(isDuplicateEntry([base], { weekdays: [1, 2, 3], startTime: '09:00', endTime: '18:00' })).toBe(true);
    });

    it('weekday 순서가 다른 동일 entry도 true를 반환해야 한다', () => {
        expect(isDuplicateEntry([base], { weekdays: [3, 1, 2], startTime: '09:00', endTime: '18:00' })).toBe(true);
    });

    it('시간이 다르면 false를 반환해야 한다', () => {
        expect(isDuplicateEntry([base], { weekdays: [1, 2, 3], startTime: '10:00', endTime: '18:00' })).toBe(false);
    });

    it('요일이 다르면 false를 반환해야 한다', () => {
        expect(isDuplicateEntry([base], { weekdays: [1, 2], startTime: '09:00', endTime: '18:00' })).toBe(false);
    });

    it('entries가 비어있으면 false를 반환해야 한다', () => {
        expect(isDuplicateEntry([], base)).toBe(false);
    });
});

import { describe, expect, it, vi } from 'vitest';
import {
    appendEntryIfNotDuplicate,
    computeDragHighlights,
    computeEntryFromDrag,
    isDuplicateEntry,
    parseCellId,
    rowToTime,
} from './dragUtils';
import type { TimeSlotEntry } from './TimeSlotForm';

describe('parseCellId', () => {
    it('유효한 셀 id를 파싱해야 한다', () => {
        expect(parseCellId('cell-0-0')).toEqual({ col: 0, row: 0 });
        expect(parseCellId('cell-6-15')).toEqual({ col: 6, row: 15 });
        expect(parseCellId('cell-3-7')).toEqual({ col: 3, row: 7 });
    });

    it('유효하지 않은 id는 null을 반환해야 한다', () => {
        expect(parseCellId('invalid')).toBeNull();
        expect(parseCellId('cell-')).toBeNull();
        expect(parseCellId('')).toBeNull();
    });
});

describe('rowToTime', () => {
    it('반시간 행 인덱스를 시간 문자열로 변환해야 한다', () => {
        expect(rowToTime(0, 8)).toBe('08:00');
        expect(rowToTime(1, 8)).toBe('08:30');
        expect(rowToTime(2, 8)).toBe('09:00');
        expect(rowToTime(3, 8)).toBe('09:30');
        expect(rowToTime(28, 8)).toBe('22:00');
    });
});

describe('computeEntryFromDrag', () => {
    const START_HOUR = 8;

    it('단일 셀 드래그 시 한 슬롯짜리 entry를 생성해야 한다', () => {
        const entry = computeEntryFromDrag('cell-0-0', 'cell-0-0', START_HOUR);
        expect(entry).toEqual({
            weekdays: [1],
            startTime: '08:00',
            endTime: '08:30',
        });
    });

    it('다중 셀 드래그 시 직사각형 범위를 생성해야 한다', () => {
        const entry = computeEntryFromDrag('cell-0-0', 'cell-2-3', START_HOUR);
        expect(entry).toEqual({
            weekdays: [1, 2, 3],
            startTime: '08:00',
            endTime: '10:00',
        });
    });

    it('역방향 드래그(끝이 시작보다 앞)를 올바르게 처리해야 한다', () => {
        const entry = computeEntryFromDrag('cell-2-3', 'cell-0-0', START_HOUR);
        expect(entry).toEqual({
            weekdays: [1, 2, 3],
            startTime: '08:00',
            endTime: '10:00',
        });
    });

    it('여러 컬럼에 걸친 드래그를 처리해야 한다', () => {
        const entry = computeEntryFromDrag('cell-1-0', 'cell-4-1', START_HOUR);
        expect(entry).toEqual({
            weekdays: [2, 3, 4, 5],
            startTime: '08:00',
            endTime: '09:00',
        });
    });

    it('컬럼 6을 일요일(weekday 0)로 매핑해야 한다', () => {
        const entry = computeEntryFromDrag('cell-6-0', 'cell-6-0', START_HOUR);
        expect(entry).toEqual({
            weekdays: [0],
            startTime: '08:00',
            endTime: '08:30',
        });
    });

    it('드래그 id가 유효하지 않으면 null을 반환해야 한다', () => {
        expect(computeEntryFromDrag('invalid', 'cell-0-0', START_HOUR)).toBeNull();
    });
});

describe('computeDragHighlights', () => {
    it('dragStartId가 null이면 빈 Set을 반환해야 한다', () => {
        expect(computeDragHighlights(null, null).size).toBe(0);
    });

    it('over가 null이면 시작 셀만 반환해야 한다', () => {
        expect(computeDragHighlights('cell-1-2', null)).toEqual(new Set(['1-2']));
    });

    it('시작과 over 사이의 직사각형 Set을 반환해야 한다', () => {
        expect(computeDragHighlights('cell-0-0', 'cell-1-1')).toEqual(
            new Set(['0-0', '0-1', '1-0', '1-1']),
        );
    });

    it('dragStartId가 유효하지 않으면 빈 Set을 반환해야 한다', () => {
        expect(computeDragHighlights('invalid', null).size).toBe(0);
    });
});

describe('isDuplicateEntry', () => {
    const base: TimeSlotEntry = { weekdays: [1, 2, 3], startTime: '09:00', endTime: '18:00' };

    it('요일과 시간이 겹치면 중복으로 감지해야 한다', () => {
        expect(isDuplicateEntry([base], { weekdays: [1], startTime: '10:00', endTime: '12:00' })).toBe(true);
    });

    it('요일이 겹치지 않으면 false를 반환해야 한다', () => {
        expect(isDuplicateEntry([base], { weekdays: [4, 5], startTime: '10:00', endTime: '12:00' })).toBe(false);
    });

    it('인접(붙어있는) 시간 범위는 false를 반환해야 한다', () => {
        expect(isDuplicateEntry([base], { weekdays: [1], startTime: '18:00', endTime: '20:00' })).toBe(false);
    });

    it('요일 순서에 관계없이 겹침을 감지해야 한다', () => {
        expect(isDuplicateEntry([base], { weekdays: [3, 1], startTime: '10:00', endTime: '12:00' })).toBe(true);
    });

    it('entries가 비어있으면 false를 반환해야 한다', () => {
        expect(isDuplicateEntry([], { weekdays: [1], startTime: '09:00', endTime: '18:00' })).toBe(false);
    });

    it('일부 요일만 겹쳐도 중복으로 감지해야 한다', () => {
        expect(isDuplicateEntry([base], { weekdays: [3, 4, 5], startTime: '10:00', endTime: '12:00' })).toBe(true);
    });

    it('시간 범위가 완전히 분리되어 있으면 false를 반환해야 한다', () => {
        expect(isDuplicateEntry([base], { weekdays: [1], startTime: '18:01', endTime: '20:00' })).toBe(false);
    });
});

describe('appendEntryIfNotDuplicate', () => {
    it('중복이 아니면 entry를 추가해야 한다', () => {
        const onAppend = vi.fn();
        const onDuplicateBlocked = vi.fn();
        const entries: TimeSlotEntry[] = [{ weekdays: [1], startTime: '09:00', endTime: '10:00' }];
        const newEntry: TimeSlotEntry = { weekdays: [2], startTime: '09:00', endTime: '10:00' };

        const result = appendEntryIfNotDuplicate(entries, newEntry, onAppend, onDuplicateBlocked);

        expect(result).toBe(true);
        expect(onAppend).toHaveBeenCalledWith([...entries, newEntry]);
        expect(onDuplicateBlocked).not.toHaveBeenCalled();
    });

    it('중복이면 추가를 막고 onDuplicateBlocked를 호출해야 한다', () => {
        const onAppend = vi.fn();
        const onDuplicateBlocked = vi.fn();
        const entries: TimeSlotEntry[] = [{ weekdays: [1], startTime: '09:00', endTime: '10:00' }];
        const duplicatedEntry: TimeSlotEntry = { weekdays: [1], startTime: '09:30', endTime: '10:30' };

        const result = appendEntryIfNotDuplicate(entries, duplicatedEntry, onAppend, onDuplicateBlocked);

        expect(result).toBe(false);
        expect(onAppend).not.toHaveBeenCalled();
        expect(onDuplicateBlocked).toHaveBeenCalledTimes(1);
        expect(onDuplicateBlocked).toHaveBeenCalledWith(duplicatedEntry);
    });

    it('newEntry가 null이면 false를 반환하고 onAppend를 호출하지 않아야 한다', () => {
        const onAppend = vi.fn();
        const result = appendEntryIfNotDuplicate([], null, onAppend);
        expect(result).toBe(false);
        expect(onAppend).not.toHaveBeenCalled();
    });
});

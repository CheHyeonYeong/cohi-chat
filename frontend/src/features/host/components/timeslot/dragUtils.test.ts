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
    it('parses valid cell id', () => {
        expect(parseCellId('cell-0-0')).toEqual({ col: 0, row: 0 });
        expect(parseCellId('cell-6-15')).toEqual({ col: 6, row: 15 });
    });

    it('returns null for invalid id', () => {
        expect(parseCellId('invalid')).toBeNull();
        expect(parseCellId('cell-')).toBeNull();
    });
});

describe('rowToTime', () => {
    it('converts half-row index into time string', () => {
        expect(rowToTime(0, 8)).toBe('08:00');
        expect(rowToTime(1, 8)).toBe('08:30');
        expect(rowToTime(2, 8)).toBe('09:00');
    });
});

describe('computeEntryFromDrag', () => {
    const START_HOUR = 8;

    it('creates one-slot entry for single cell drag', () => {
        const entry = computeEntryFromDrag('cell-0-0', 'cell-0-0', START_HOUR);
        expect(entry).toEqual({
            weekdays: [1],
            startTime: '08:00',
            endTime: '08:30',
        });
    });

    it('creates rectangular range for multi-cell drag', () => {
        const entry = computeEntryFromDrag('cell-0-0', 'cell-2-3', START_HOUR);
        expect(entry).toEqual({
            weekdays: [1, 2, 3],
            startTime: '08:00',
            endTime: '10:00',
        });
    });

    it('returns null if drag id is invalid', () => {
        expect(computeEntryFromDrag('invalid', 'cell-0-0', START_HOUR)).toBeNull();
    });
});

describe('computeDragHighlights', () => {
    it('returns empty set if dragStartId is null', () => {
        expect(computeDragHighlights(null, null).size).toBe(0);
    });

    it('returns start cell only when over is null', () => {
        expect(computeDragHighlights('cell-1-2', null)).toEqual(new Set(['1-2']));
    });

    it('returns rectangular set between start and over', () => {
        expect(computeDragHighlights('cell-0-0', 'cell-1-1')).toEqual(
            new Set(['0-0', '0-1', '1-0', '1-1']),
        );
    });
});

describe('isDuplicateEntry', () => {
    const base: TimeSlotEntry = { weekdays: [1, 2, 3], startTime: '09:00', endTime: '18:00' };

    it('detects duplicate when weekday and time overlap', () => {
        expect(isDuplicateEntry([base], { weekdays: [1], startTime: '10:00', endTime: '12:00' })).toBe(true);
    });

    it('returns false when weekday does not overlap', () => {
        expect(isDuplicateEntry([base], { weekdays: [4, 5], startTime: '10:00', endTime: '12:00' })).toBe(false);
    });

    it('returns false for touching range without overlap', () => {
        expect(isDuplicateEntry([base], { weekdays: [1], startTime: '18:00', endTime: '20:00' })).toBe(false);
    });
});

describe('appendEntryIfNotDuplicate', () => {
    it('appends entry when not duplicated', () => {
        const onAppend = vi.fn();
        const onDuplicateBlocked = vi.fn();
        const entries: TimeSlotEntry[] = [{ weekdays: [1], startTime: '09:00', endTime: '10:00' }];
        const newEntry: TimeSlotEntry = { weekdays: [2], startTime: '09:00', endTime: '10:00' };

        const result = appendEntryIfNotDuplicate(entries, newEntry, onAppend, onDuplicateBlocked);

        expect(result).toBe(true);
        expect(onAppend).toHaveBeenCalledWith([...entries, newEntry]);
        expect(onDuplicateBlocked).not.toHaveBeenCalled();
    });

    it('blocks append and notifies when duplicate', () => {
        const onAppend = vi.fn();
        const onDuplicateBlocked = vi.fn();
        const entries: TimeSlotEntry[] = [{ weekdays: [1], startTime: '09:00', endTime: '10:00' }];
        const duplicatedEntry: TimeSlotEntry = { weekdays: [1], startTime: '09:30', endTime: '10:30' };

        const result = appendEntryIfNotDuplicate(entries, duplicatedEntry, onAppend, onDuplicateBlocked);

        expect(result).toBe(false);
        expect(onAppend).not.toHaveBeenCalled();
        expect(onDuplicateBlocked).toHaveBeenCalledTimes(1);
    });
});

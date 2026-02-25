import type { TimeSlotEntry } from './TimeSlotForm';

/**
 * col index → weekday
 * 0=월, 1=화, 2=수, 3=목, 4=금, 5=토, 6=일
 * 일요일은 weekday 값이 0이므로 sort((a,b)=>a-b) 시 배열 맨 앞에 위치함 — 의도된 동작
 */
const COL_TO_WEEKDAY: Record<number, number> = {
    0: 1, // 월
    1: 2, // 화
    2: 3, // 수
    3: 4, // 목
    4: 5, // 금
    5: 6, // 토
    6: 0, // 일
};

export function parseCellId(id: string): { col: number; row: number } | null {
    const match = id.match(/^cell-(\d+)-(\d+)$/);
    if (!match) return null;
    return { col: parseInt(match[1], 10), row: parseInt(match[2], 10) };
}

export function rowToTime(row: number, startHour: number): string {
    const totalMinutes = row * 30 + startHour * 60;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function computeEntryFromDrag(
    startId: string,
    endId: string,
    startHour: number,
): TimeSlotEntry | null {
    const start = parseCellId(startId);
    const end = parseCellId(endId);
    if (!start || !end) return null;

    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);

    // weekday 0(일)이 sort 후 맨 앞에 오는 것은 정상 — TimeSlotForm 소비 측에서 순서 무관
    const weekdays = Array.from({ length: maxCol - minCol + 1 }, (_, i) => COL_TO_WEEKDAY[minCol + i])
        .sort((a, b) => a - b);

    return {
        weekdays,
        startTime: rowToTime(minRow, startHour),
        // endTime은 마지막 half-row의 다음 경계 — 그리드가 동적으로 확장되므로 정상
        endTime: rowToTime(maxRow + 1, startHour),
    };
}

/**
 * 드래그 범위에 포함되는 (col, halfRow) 집합 계산
 * dragOverId가 null이면 dragStartId 위치만 하이라이트
 */
export function computeDragHighlights(
    dragStartId: string | null,
    dragOverId: string | null,
): Set<string> {
    if (!dragStartId) return new Set();
    const start = parseCellId(dragStartId);
    const over = parseCellId(dragOverId ?? dragStartId);
    if (!start || !over) return new Set();

    const minCol = Math.min(start.col, over.col);
    const maxCol = Math.max(start.col, over.col);
    const minRow = Math.min(start.row, over.row);
    const maxRow = Math.max(start.row, over.row);

    const set = new Set<string>();
    for (let c = minCol; c <= maxCol; c++) {
        for (let r = minRow; r <= maxRow; r++) {
            set.add(`${c}-${r}`);
        }
    }
    return set;
}

/** 새 entry와 요일이 겹치면서 시간대도 겹치는 entry가 이미 존재하는지 확인 */
export function isDuplicateEntry(entries: TimeSlotEntry[], newEntry: TimeSlotEntry): boolean {
    return entries.some(
        (e) =>
            newEntry.startTime < e.endTime &&
            newEntry.endTime > e.startTime &&
            e.weekdays.some((wd) => newEntry.weekdays.includes(wd)),
    );
}

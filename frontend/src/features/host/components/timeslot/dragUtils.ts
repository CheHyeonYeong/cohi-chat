import type { TimeSlotEntry } from './TimeSlotForm';

/** col index → weekday (0=일, 1=월, ..., 6=토) */
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

    const weekdays = Array.from({ length: maxCol - minCol + 1 }, (_, i) => COL_TO_WEEKDAY[minCol + i])
        .sort((a, b) => a - b);

    return {
        weekdays,
        startTime: rowToTime(minRow, startHour),
        endTime: rowToTime(maxRow + 1, startHour),
    };
}

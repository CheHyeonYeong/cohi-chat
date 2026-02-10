import type { TimeSlotEntry } from './TimeSlotForm';

interface WeeklySchedulePreviewProps {
    entries: TimeSlotEntry[];
}

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
const DAY_MAP: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 }; // weekday(0=일) → column index
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00 ~ 22:00

function timeToRow(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return Math.max(0, (h - 8) * 2 + Math.round(m / 30));
}

export default function WeeklySchedulePreview({ entries }: WeeklySchedulePreviewProps) {
    // Build highlight map: column → [startRow, endRow][]
    const highlights: Map<number, { start: number; end: number }[]> = new Map();
    for (const entry of entries) {
        if (!entry.startTime || !entry.endTime || entry.weekdays.length === 0) continue;
        const startRow = timeToRow(entry.startTime);
        const endRow = timeToRow(entry.endTime);
        if (startRow >= endRow) continue;

        for (const wd of entry.weekdays) {
            const col = DAY_MAP[wd];
            if (col === undefined) continue;
            if (!highlights.has(col)) highlights.set(col, []);
            highlights.get(col)!.push({ start: startRow, end: endRow });
        }
    }

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-[var(--cohe-text-dark)] mb-4">주간 스케줄 미리보기</h3>

            <div className="overflow-x-auto">
                <div className="min-w-[420px]">
                    {/* Header */}
                    <div className="grid grid-cols-[50px_repeat(7,1fr)] gap-px mb-1">
                        <div />
                        {DAY_LABELS.map((label) => (
                            <div key={label} className="text-center text-sm font-semibold text-[var(--cohe-text-dark)] py-1">
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="relative grid grid-cols-[50px_repeat(7,1fr)] gap-px bg-gray-100 rounded-lg overflow-hidden">
                        {/* Time labels + cells */}
                        {HOURS.map((hour) => (
                            <div key={hour} className="contents">
                                {/* Time label */}
                                <div className="bg-white flex items-start justify-end pr-2 pt-0.5 h-12">
                                    <span className="text-xs text-gray-400">
                                        {String(hour).padStart(2, '0')}:00
                                    </span>
                                </div>
                                {/* Day cells */}
                                {Array.from({ length: 7 }, (_, colIdx) => {
                                    const rowIdx = (hour - 8) * 2;
                                    const colHighlights = highlights.get(colIdx) ?? [];
                                    const isTop = colHighlights.some((h) => rowIdx >= h.start && rowIdx < h.end);
                                    const isBottom = colHighlights.some((h) => rowIdx + 1 >= h.start && rowIdx + 1 < h.end);

                                    return (
                                        <div key={colIdx} className="bg-white h-12 flex flex-col">
                                            <div
                                                className="flex-1"
                                                style={isTop ? { backgroundColor: 'var(--cohe-primary)', opacity: 0.2 } : undefined}
                                            />
                                            <div
                                                className="flex-1"
                                                style={isBottom ? { backgroundColor: 'var(--cohe-primary)', opacity: 0.2 } : undefined}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <p className="text-sm text-gray-400 text-center mt-3">
                왼쪽 폼에서 시간대를 설정하면 미리보기에 반영됩니다
            </p>
        </div>
    );
}

import { useCallback, useMemo, useState } from 'react';
import {
    DndContext,
    PointerSensor,
    TouchSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    useDraggable,
    useDroppable,
    type DragEndEvent,
    type DragOverEvent,
    type DragStartEvent,
} from '@dnd-kit/core';
import type { TimeSlotEntry } from './TimeSlotForm';
import { computeEntryFromDrag, computeDragHighlights, isDuplicateEntry } from './dragUtils';

interface WeeklySchedulePreviewProps {
    entries: TimeSlotEntry[];
    onChange?: (entries: TimeSlotEntry[]) => void;
}

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
const DAY_MAP: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };

const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 22;

function parseHour(time: string): number {
    return parseInt(time.split(':')[0], 10);
}

function computeHoursRange(entries: TimeSlotEntry[]): number[] {
    let minHour = DEFAULT_START_HOUR;
    let maxHour = DEFAULT_END_HOUR;

    for (const entry of entries) {
        if (!entry.startTime || !entry.endTime || entry.weekdays.length === 0) continue;
        const startHour = parseHour(entry.startTime);
        const endHour = parseHour(entry.endTime);
        if (entry.startTime >= entry.endTime) continue;

        minHour = Math.min(minHour, startHour);
        const endMinute = parseInt(entry.endTime.split(':')[1], 10);
        const adjustedEndHour = endMinute > 0 ? endHour + 1 : endHour;
        maxHour = Math.max(maxHour, adjustedEndHour);
    }

    const length = maxHour - minHour + 1;
    return Array.from({ length }, (_, i) => minHour + i);
}

function timeToRow(time: string, startHour: number): number {
    const [h, m] = time.split(':').map(Number);
    return Math.max(0, (h - startHour) * 2 + Math.round(m / 30));
}

/** read-only 모드 반시간 셀 — dnd 훅 없음 */
function ReadOnlyHalfCell({ isHighlighted }: { isHighlighted: boolean }) {
    return (
        <div
            className="h-6"
            style={isHighlighted ? { backgroundColor: 'var(--cohi-primary)', opacity: 0.2 } : undefined}
        />
    );
}

/** interactive 모드 반시간 셀 — DndContext 내부에서만 사용 */
function DraggableCell({
    col,
    halfRow,
    isHighlighted,
    isInDragRange,
}: {
    col: number;
    halfRow: number;
    isHighlighted: boolean;
    isInDragRange: boolean;
}) {
    const id = `cell-${col}-${halfRow}`;
    const { setNodeRef: setDragRef, attributes, listeners } = useDraggable({ id });
    const { setNodeRef: setDropRef } = useDroppable({ id });

    // useCallback으로 안정화 — 렌더마다 새 참조 생성 시 dnd-kit ref가 매번 재등록됨
    const setRef = useCallback(
        (node: HTMLElement | null) => {
            setDragRef(node);
            setDropRef(node);
        },
        [setDragRef, setDropRef],
    );

    return (
        <div
            ref={setRef}
            {...attributes}
            {...listeners}
            tabIndex={0}
            data-testid={`grid-cell-${col}-${halfRow}`}
            className="h-6 transition-colors"
            style={{
                backgroundColor: isHighlighted ? 'var(--cohi-primary)' : undefined,
                opacity: isHighlighted ? (isInDragRange ? 0.4 : 0.2) : undefined,
                cursor: 'crosshair',
                touchAction: 'none',
            }}
        />
    );
}

function WeeklyGrid({
    hours,
    highlights,
    dragHighlights,
    isDragging,
    isInteractive,
}: {
    hours: number[];
    highlights: Map<number, { start: number; end: number }[]>;
    dragHighlights: Set<string>;
    isDragging: boolean;
    isInteractive: boolean;
}) {
    const startHour = hours[0] ?? DEFAULT_START_HOUR;

    return (
        <div className="relative grid grid-cols-[50px_repeat(7,1fr)] gap-px bg-gray-100 rounded-lg overflow-hidden">
            {hours.map((hour) => {
                const baseHalfRow = (hour - startHour) * 2;
                return (
                    <div key={hour} className="contents">
                        {/* Time label */}
                        <div className="bg-white flex items-start justify-end pr-2 pt-0.5 h-12">
                            <span data-testid="time-label" className="text-xs text-gray-400">
                                {String(hour).padStart(2, '0')}:00
                            </span>
                        </div>

                        {/* Day cells — each cell contains two half-rows (top :00, bottom :30) */}
                        {Array.from({ length: 7 }, (_, colIdx) => {
                            const topHalfRow = baseHalfRow;
                            const bottomHalfRow = baseHalfRow + 1;
                            const colHighlights = highlights.get(colIdx) ?? [];

                            const topExisting = colHighlights.some(
                                (h) => topHalfRow >= h.start && topHalfRow < h.end,
                            );
                            const bottomExisting = colHighlights.some(
                                (h) => bottomHalfRow >= h.start && bottomHalfRow < h.end,
                            );
                            const topInRange = dragHighlights.has(`${colIdx}-${topHalfRow}`);
                            const bottomInRange = dragHighlights.has(`${colIdx}-${bottomHalfRow}`);

                            return (
                                <div key={colIdx} className="bg-white h-12 flex flex-col">
                                    {isInteractive ? (
                                        <>
                                            <DraggableCell
                                                col={colIdx}
                                                halfRow={topHalfRow}
                                                isHighlighted={topExisting || topInRange}
                                                isInDragRange={isDragging && topInRange}
                                            />
                                            <DraggableCell
                                                col={colIdx}
                                                halfRow={bottomHalfRow}
                                                isHighlighted={bottomExisting || bottomInRange}
                                                isInDragRange={isDragging && bottomInRange}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <ReadOnlyHalfCell isHighlighted={topExisting} />
                                            <ReadOnlyHalfCell isHighlighted={bottomExisting} />
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}

export default function WeeklySchedulePreview({ entries, onChange }: WeeklySchedulePreviewProps) {
    const [dragStartId, setDragStartId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 1 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
        useSensor(KeyboardSensor),
    );

    const hours = useMemo(() => computeHoursRange(entries), [entries]);
    const startHour = hours[0] ?? DEFAULT_START_HOUR;

    const highlights = useMemo(() => {
        const map = new Map<number, { start: number; end: number }[]>();
        for (const entry of entries) {
            if (!entry.startTime || !entry.endTime || entry.weekdays.length === 0) continue;
            const startRow = timeToRow(entry.startTime, startHour);
            const endRow = timeToRow(entry.endTime, startHour);
            if (startRow >= endRow) continue;

            for (const wd of entry.weekdays) {
                const col = DAY_MAP[wd];
                if (col === undefined) continue;
                if (!map.has(col)) map.set(col, []);
                map.get(col)!.push({ start: startRow, end: endRow });
            }
        }
        return map;
    }, [entries, startHour]);

    const dragHighlights = computeDragHighlights(dragStartId, dragOverId);
    const isDragging = dragStartId !== null;

    const handleDragStart = (event: DragStartEvent) => {
        setDragStartId(event.active.id as string);
        setDragOverId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        setDragOverId((event.over?.id as string) ?? null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const endId = (event.over?.id as string) ?? dragStartId;
        if (onChange && dragStartId && endId) {
            const entry = computeEntryFromDrag(dragStartId, endId, startHour);
            if (entry && !isDuplicateEntry(entries, entry)) {
                onChange([...entries, entry]);
            }
        }
        setDragStartId(null);
        setDragOverId(null);
    };

    const handleDragCancel = () => {
        setDragStartId(null);
        setDragOverId(null);
    };

    const grid = (
        <WeeklyGrid
            hours={hours}
            highlights={highlights}
            dragHighlights={dragHighlights}
            isDragging={isDragging}
            isInteractive={!!onChange}
        />
    );

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-[var(--cohi-text-dark)] mb-4">주간 스케줄 미리보기</h3>

            <div className="overflow-x-auto">
                <div className="min-w-[420px]">
                    {/* Header */}
                    <div className="grid grid-cols-[50px_repeat(7,1fr)] gap-px mb-1">
                        <div />
                        {DAY_LABELS.map((label) => (
                            <div key={label} className="text-center text-sm font-semibold text-[var(--cohi-text-dark)] py-1">
                                {label}
                            </div>
                        ))}
                    </div>

                    {onChange ? (
                        <DndContext
                            sensors={sensors}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDragEnd={handleDragEnd}
                            onDragCancel={handleDragCancel}
                        >
                            {grid}
                        </DndContext>
                    ) : (
                        grid
                    )}
                </div>
            </div>

            <p className="text-sm text-gray-400 text-center mt-3">
                {onChange
                    ? '그리드를 드래그해 타임슬롯을 추가하거나, 왼쪽 폼에서 직접 설정하세요'
                    : '왼쪽 폼에서 시간대를 설정하면 미리보기에 반영됩니다'}
            </p>
        </div>
    );
}

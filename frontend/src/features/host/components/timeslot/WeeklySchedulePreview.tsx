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
import { Card } from '~/components/card';
import type { TimeSlotEntry } from './TimeSlotForm';
import { computeDragHighlights, commitDraggedEntry, parseCellId } from './dragUtils';
import { WEEKDAY_LABELS, WEEKDAY_TO_COLUMN, type Weekday } from '~/libs/constants/days';

interface WeeklySchedulePreviewProps {
    entries: TimeSlotEntry[];
    onChange?: (entries: TimeSlotEntry[]) => void;
    onDuplicateBlocked?: (entry: TimeSlotEntry) => void;
    onDeleteEntry?: (entry: TimeSlotEntry, index: number) => void;
}


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
            data-highlighted={isHighlighted || undefined}
            className={isHighlighted ? 'h-6 bg-[var(--cohi-timeslot-existing)]' : 'h-6'}
        />
    );
}

/** interactive 모드 반시간 셀 — DndContext 내부에서만 사용 */
function DraggableCell({
    col,
    halfRow,
    isHighlighted,
    isInDragRange,
    onContextDelete,
}: {
    col: number;
    halfRow: number;
    isHighlighted: boolean;
    isInDragRange: boolean;
    onContextDelete?: (cellId: string) => void;
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
            onContextMenu={(event) => {
                if (!onContextDelete) return;
                event.preventDefault();
                event.stopPropagation();
                onContextDelete(id);
            }}
            tabIndex={0}
            data-testid={`grid-cell-${col}-${halfRow}`}
            data-highlighted={isHighlighted || undefined}
            className={[
                'h-6 transition-colors duration-100 cursor-crosshair',
                isInDragRange ? 'bg-[var(--cohi-timeslot-drag)]' : isHighlighted ? 'bg-[var(--cohi-timeslot-existing)]' : '',
            ].join(' ')}
            style={{ touchAction: 'none' }}
        />
    );
}

function WeeklyGrid({
    hours,
    highlights,
    dragHighlights,
    isInteractive,
    onContextDelete,
}: {
    hours: number[];
    highlights: Map<number, { start: number; end: number }[]>;
    dragHighlights: Set<string>;
    isInteractive: boolean;
    onContextDelete?: (cellId: string) => void;
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
                                                isInDragRange={topInRange}
                                                onContextDelete={onContextDelete}
                                            />
                                            <DraggableCell
                                                col={colIdx}
                                                halfRow={bottomHalfRow}
                                                isHighlighted={bottomExisting || bottomInRange}
                                                isInDragRange={bottomInRange}
                                                onContextDelete={onContextDelete}
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


export function WeeklySchedulePreview({
    entries,
    onChange,
    onDuplicateBlocked,
    onDeleteEntry,
}: WeeklySchedulePreviewProps) {
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
                const col = WEEKDAY_TO_COLUMN[wd as Weekday];
                if (col === undefined) continue;
                if (!map.has(col)) map.set(col, []);
                map.get(col)!.push({ start: startRow, end: endRow });
            }
        }
        return map;
    }, [entries, startHour]);

    const dragHighlights = useMemo(
        () => computeDragHighlights(dragStartId, dragOverId),
        [dragStartId, dragOverId],
    );
    const handleDragStart = (event: DragStartEvent) => {
        setDragStartId(event.active.id as string);
        setDragOverId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        setDragOverId((event.over?.id as string) ?? null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const endId = (event.over?.id as string) ?? dragStartId;
        commitDraggedEntry({ entries, onChange, onDuplicateBlocked, dragStartId, endId, startHour });
        setDragStartId(null);
        setDragOverId(null);
    };

    const handleDragCancel = () => {
        setDragStartId(null);
        setDragOverId(null);
    };

    const cellEntryIndices = useMemo(() => {
        const map = new Map<string, number[]>();
        entries.forEach((entry, entryIndex) => {
            if (!entry.startTime || !entry.endTime || entry.weekdays.length === 0) return;
            const startRow = timeToRow(entry.startTime, startHour);
            const endRow = timeToRow(entry.endTime, startHour);
            if (startRow >= endRow) return;

            entry.weekdays.forEach((wd) => {
                const col = WEEKDAY_TO_COLUMN[wd as Weekday];
                if (col === undefined) return;
                for (let row = startRow; row < endRow; row += 1) {
                    const key = `${col}-${row}`;
                    const current = map.get(key) ?? [];
                    current.push(entryIndex);
                    map.set(key, current);
                }
            });
        });
        return map;
    }, [entries, startHour]);

    const handleContextDelete = useCallback((cellId: string) => {
        if (!onChange) return;
        const parsed = parseCellId(cellId);
        if (!parsed) return;

        const key = `${parsed.col}-${parsed.row}`;
        const matched = cellEntryIndices.get(key);
        if (!matched || matched.length === 0) return;

        const targetIndex = matched[matched.length - 1];
        const targetEntry = entries[targetIndex];
        if (!targetEntry) return;
        const confirmDelete = window.confirm('선택한 예약 시간대를 삭제할까요?');
        if (!confirmDelete) return;

        if (onDeleteEntry) {
            onDeleteEntry(targetEntry, targetIndex);
            return;
        }

        onChange(entries.filter((_, index) => index !== targetIndex));
    }, [cellEntryIndices, entries, onChange, onDeleteEntry]);
    const grid = (
        <WeeklyGrid
            hours={hours}
            highlights={highlights}
            dragHighlights={dragHighlights}
            isInteractive={!!onChange}
            onContextDelete={handleContextDelete}
        />
    );

    return (
        <Card size="sm" title="주간 스케줄 미리보기">
            <div className="overflow-x-auto">
                <div className="min-w-[420px]">
                    {/* Header */}
                    <div className="grid grid-cols-[50px_repeat(7,1fr)] gap-px mb-1">
                        <div />
                        {WEEKDAY_LABELS.map((label) => (
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
        </Card>
    );
}

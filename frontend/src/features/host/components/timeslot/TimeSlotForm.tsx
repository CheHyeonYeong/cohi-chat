import { useState, useRef, useMemo, useEffect } from 'react';
import Button from '~/components/button/Button';
import { Card } from '~/components/card';
import { isDuplicateEntry } from './dragUtils';
import { WEEKDAYS } from '~/libs/constants/days';

export const DEFAULT_DATE_RANGE_DAYS = 30;

export interface TimeSlotEntry {
    weekdays: number[];
    startTime: string;
    endTime: string;
    startDate?: string;
    endDate?: string;
    /** 서버에서 불러온 기존 타임슬롯의 ID. undefined면 신규. */
    existingId?: number;
}

function isInvalidTimeRange(startTime: string, endTime: string): boolean {
    return startTime >= endTime;
}

interface TimeSlotFormProps {
    entries: TimeSlotEntry[];
    onChange: (entries: TimeSlotEntry[]) => void;
    onSave: () => void;
    onDelete?: (existingId: number) => void;
    onOverlapDetected?: () => void;
    isPending: boolean;
    deletingId?: number | null;
    errors: Record<string, string>;
}

const toLocalDateString = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};


// 00:00 ~ 23:30, 30분 단위
const DAY_LABEL_MAP = WEEKDAYS.reduce<Record<number, string>>((acc, day) => {
    acc[day.value] = day.label;
    return acc;
}, {});

function formatEntrySummary(entry: TimeSlotEntry): string {
    const weekdayLabels = [...entry.weekdays]
        .sort((a, b) => a - b)
        .map((weekday) => DAY_LABEL_MAP[weekday])
        .filter(Boolean);
    const weekdayText = weekdayLabels.length > 0 ? weekdayLabels.join(', ') : '요일 미선택';
    return `${weekdayText} · ${entry.startTime} - ${entry.endTime}`;
}

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2);
    const m = i % 2 === 0 ? '00' : '30';
    return `${String(h).padStart(2, '0')}:${m}`;
});

export default function TimeSlotForm({
    entries,
    onChange,
    onSave,
    onDelete,
    onOverlapDetected,
    isPending,
    deletingId,
    errors,
}: TimeSlotFormProps) {
    const [expandedIndex, setExpandedIndex] = useState(0);
    const savedDatesRef = useRef<Record<number, { startDate: string; endDate: string }>>({});

    const timeValidationErrors = useMemo(() => {
        return entries.map((entry) => {
            if (entry.existingId != null) return null;
            if (isInvalidTimeRange(entry.startTime, entry.endTime)) {
                return '시작 시간은 종료 시간보다 이전이어야 합니다';
            }
            return null;
        });
    }, [entries]);

    const overlapErrors = useMemo(() => {
        return entries.map((entry, index) => {
            if (entry.existingId != null) return null;
            const others = entries.filter((_, i) => i !== index);
            return isDuplicateEntry(others, entry) ? '다른 시간대와 겹칩니다' : null;
        });
    }, [entries]);

    const hasOverlapError = overlapErrors.some(Boolean);
    const prevHasOverlapRef = useRef(hasOverlapError);

    useEffect(() => {
        if (hasOverlapError && !prevHasOverlapRef.current) {
            onOverlapDetected?.();
        }
        prevHasOverlapRef.current = hasOverlapError;
    }, [hasOverlapError, onOverlapDetected]);

    const updateEntry = (index: number, patch: Partial<TimeSlotEntry>) => {
        const updated = entries.map((e, i) => (i === index ? { ...e, ...patch } : e));
        onChange(updated);
    };

    const toggleWeekday = (index: number, day: number) => {
        const entry = entries[index];
        const weekdays = entry.weekdays.includes(day)
            ? entry.weekdays.filter((d) => d !== day)
            : [...entry.weekdays, day];
        updateEntry(index, { weekdays });
    };

    const addEntry = () => {
        onChange([...entries, { weekdays: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '18:00' }]);
        setExpandedIndex(entries.length);
    };

    const removeEntry = (index: number) => {
        // 삭제된 항목 이후 인덱스를 당겨서 savedDatesRef 재구성
        const newSavedDates: Record<number, { startDate: string; endDate: string }> = {};
        Object.entries(savedDatesRef.current).forEach(([key, value]) => {
            const k = Number(key);
            if (k < index) newSavedDates[k] = value;
            else if (k > index) newSavedDates[k - 1] = value;
            // k === index는 삭제
        });
        savedDatesRef.current = newSavedDates;
        const updated = entries.filter((_, i) => i !== index);
        onChange(updated);
        setExpandedIndex(updated.length > 0 && expandedIndex >= updated.length ? updated.length - 1 : -1);
    };

    return (
        <Card size="sm" title="📅 예약 가능 시간 설정">
            <div className="space-y-4">
                {entries.map((entry, index) => (
                    <div
                        key={index}
                        className={`rounded-xl border transition-colors ${
                            expandedIndex === index ? 'border-[var(--cohi-primary)]/30 bg-[var(--cohi-bg-light)]/50' : 'border-gray-200'
                        } p-4`}
                    >
                        <div
                            data-testid="entry-header"
                            className="flex justify-between items-center cursor-pointer"
                            onClick={() => setExpandedIndex(expandedIndex === index ? -1 : index)}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-[var(--cohi-text-dark)]">
                                    시간대 {index + 1}
                                </span>
                                <span data-testid="entry-summary" className="text-xs text-gray-500">
                                    {formatEntrySummary(entry)}
                                </span>
                                {entry.existingId != null && (
                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">저장됨</span>
                                )}
                                {(timeValidationErrors[index] || overlapErrors[index]) && (
                                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                                )}
                            </div>
                            {entry.existingId != null && onDelete ? (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onDelete(entry.existingId!); }}
                                    disabled={deletingId != null}
                                    className="text-sm text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                >
                                    {deletingId === entry.existingId ? '삭제 중...' : '삭제'}
                                </button>
                            ) : !entry.existingId ? (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeEntry(index); }}
                                    className="text-sm text-red-400 hover:text-red-600 transition-colors"
                                >
                                    삭제
                                </button>
                            ) : null}
                        </div>

                        {expandedIndex === index && (
                            <div className="mt-4 space-y-4">
                                {entry.existingId != null && (
                                    <p className="text-xs text-gray-400">기존 타임슬롯은 수정할 수 없습니다. 삭제 후 다시 생성해주세요.</p>
                                )}
                                {/* Weekday toggle */}
                                <div>
                                    <label className="block text-sm text-gray-500 mb-2">요일</label>
                                    <div className="flex gap-1.5">
                                        {WEEKDAYS.map((day) => {
                                            const selected = entry.weekdays.includes(day.value);
                                            return (
                                                <button
                                                    key={day.value}
                                                    type="button"
                                                    onClick={() => !entry.existingId && toggleWeekday(index, day.value)}
                                                    disabled={entry.existingId != null}
                                                    className={`w-10 h-10 rounded-lg text-sm font-semibold transition-colors ${
                                                        selected
                                                            ? 'bg-[var(--cohi-primary)] text-white'
                                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                    } ${entry.existingId != null ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                >
                                                    {day.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Time range */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-2">시작 시간</label>
                                        <select
                                            value={entry.startTime}
                                            onChange={(e) => updateEntry(index, { startTime: e.target.value })}
                                            disabled={entry.existingId != null}
                                            className={`w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-[var(--cohi-text-dark)] focus:outline-none focus:border-[var(--cohi-primary)] focus:ring-1 focus:ring-[var(--cohi-primary)] ${entry.existingId != null ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        >
                                            {TIME_OPTIONS.map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-2">종료 시간</label>
                                        <select
                                            value={entry.endTime}
                                            onChange={(e) => updateEntry(index, { endTime: e.target.value })}
                                            disabled={entry.existingId != null}
                                            className={`w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-[var(--cohi-text-dark)] focus:outline-none focus:border-[var(--cohi-primary)] focus:ring-1 focus:ring-[var(--cohi-primary)] ${entry.existingId != null ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        >
                                            {TIME_OPTIONS.map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Date range */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm text-gray-500 mb-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={!!entry.startDate}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    const saved = savedDatesRef.current[index];
                                                    if (saved) {
                                                        updateEntry(index, { startDate: saved.startDate, endDate: saved.endDate });
                                                    } else {
                                                        const now = new Date();
                                                        const today = toLocalDateString(now);
                                                        const later = new Date(now);
                                                        later.setDate(later.getDate() + DEFAULT_DATE_RANGE_DAYS);
                                                        updateEntry(index, { startDate: today, endDate: toLocalDateString(later) });
                                                    }
                                                } else {
                                                    if (entry.startDate) {
                                                        savedDatesRef.current[index] = { startDate: entry.startDate, endDate: entry.endDate ?? '' };
                                                    }
                                                    updateEntry(index, { startDate: undefined, endDate: undefined });
                                                }
                                            }}
                                            disabled={entry.existingId != null}
                                            className="rounded border-gray-300"
                                        />
                                        기간 지정
                                    </label>
                                    {entry.existingId != null && entry.startDate && (
                                        <p className="text-xs text-gray-400 mb-2">기존 타임슬롯의 기간은 수정할 수 없습니다.</p>
                                    )}
                                    {entry.startDate && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm text-gray-500 mb-1">시작일</label>
                                                <input
                                                    type="date"
                                                    value={entry.startDate ?? ''}
                                                    onChange={(e) => updateEntry(index, { startDate: e.target.value })}
                                                    disabled={entry.existingId != null}
                                                    min={toLocalDateString(new Date())}
                                                    className={`w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-[var(--cohi-text-dark)] focus:outline-none focus:border-[var(--cohi-primary)] focus:ring-1 focus:ring-[var(--cohi-primary)] ${entry.existingId != null ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-500 mb-1">종료일</label>
                                                <input
                                                    type="date"
                                                    value={entry.endDate ?? ''}
                                                    onChange={(e) => updateEntry(index, { endDate: e.target.value })}
                                                    disabled={entry.existingId != null}
                                                    min={entry.startDate}
                                                    className={`w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-[var(--cohi-text-dark)] focus:outline-none focus:border-[var(--cohi-primary)] focus:ring-1 focus:ring-[var(--cohi-primary)] ${entry.existingId != null ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Inline time validation error */}
                                {timeValidationErrors[index] && (
                                    <p
                                        data-testid="time-validation-error"
                                        className="text-sm text-red-500 mt-2"
                                    >
                                        {timeValidationErrors[index]}
                                    </p>
                                )}
                                {overlapErrors[index] && (
                                    <p
                                        data-testid="overlap-error"
                                        className="text-sm text-red-500 mt-2"
                                    >
                                        {overlapErrors[index]}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Add entry */}
            <button
                type="button"
                onClick={addEntry}
                className="mt-4 text-sm font-medium text-[var(--cohi-primary)] hover:text-[var(--cohi-primary-dark)] transition-colors"
            >
                + 시간대 추가
            </button>

            {/* Errors */}
            {Object.values(errors).map((msg, i) => (
                <p key={i} className="mt-2 text-sm text-red-500">{msg}</p>
            ))}

            {/* 겹침/시간 오류 요약 */}
            {(timeValidationErrors.some(Boolean) || overlapErrors.some(Boolean)) && (
                <p className="text-sm text-red-500 mt-4 text-center">
                    저장할 수 없는 시간대가 있습니다. 각 시간대를 확인해주세요.
                </p>
            )}

            {/* Save */}
            <Button
                variant="primary"
                size="lg"
                onClick={onSave}
                loading={isPending}
                disabled={timeValidationErrors.some(Boolean) || overlapErrors.some(Boolean)}
                className="w-full mt-6 rounded-lg"
            >
                {isPending ? '저장 중...' : '저장하기'}
            </Button>
        </Card>
    );
}

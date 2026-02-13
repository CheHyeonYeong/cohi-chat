import { useState, useMemo } from 'react';

export interface TimeSlotEntry {
    weekdays: number[];
    startTime: string;
    endTime: string;
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
    isPending: boolean;
    deletingId?: number | null;
    errors: Record<string, string>;
}

const DAYS = [
    { label: '일', value: 0 },
    { label: '월', value: 1 },
    { label: '화', value: 2 },
    { label: '수', value: 3 },
    { label: '목', value: 4 },
    { label: '금', value: 5 },
    { label: '토', value: 6 },
];

// 00:00 ~ 23:30, 30분 단위
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2);
    const m = i % 2 === 0 ? '00' : '30';
    return `${String(h).padStart(2, '0')}:${m}`;
});

export default function TimeSlotForm({ entries, onChange, onSave, onDelete, isPending, deletingId, errors }: TimeSlotFormProps) {
    const [expandedIndex, setExpandedIndex] = useState(0);

    const timeValidationErrors = useMemo(() => {
        return entries.map((entry) => {
            if (entry.existingId != null) return null;
            if (isInvalidTimeRange(entry.startTime, entry.endTime)) {
                return '시작 시간은 종료 시간보다 이전이어야 합니다';
            }
            return null;
        });
    }, [entries]);

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
        if (entries.length <= 1) return;
        const updated = entries.filter((_, i) => i !== index);
        onChange(updated);
        if (expandedIndex >= updated.length) setExpandedIndex(updated.length - 1);
    };

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-[var(--cohe-text-dark)] text-lg mb-5 flex items-center gap-2">
                <span className="text-xl">📅</span> 예약 가능 시간 설정
            </h3>

            <div className="space-y-4">
                {entries.map((entry, index) => (
                    <div
                        key={index}
                        className={`rounded-xl border transition-colors ${
                            expandedIndex === index ? 'border-[var(--cohe-primary)]/30 bg-[var(--cohe-bg-light)]/50' : 'border-gray-200'
                        } p-4`}
                    >
                        <div
                            className="flex justify-between items-center cursor-pointer"
                            onClick={() => setExpandedIndex(index)}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-[var(--cohe-text-dark)]">
                                    시간대 {index + 1}
                                </span>
                                {entry.existingId != null && (
                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">저장됨</span>
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
                            ) : entries.length > 1 && !entry.existingId ? (
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
                                        {DAYS.map((day) => {
                                            const selected = entry.weekdays.includes(day.value);
                                            return (
                                                <button
                                                    key={day.value}
                                                    type="button"
                                                    onClick={() => !entry.existingId && toggleWeekday(index, day.value)}
                                                    disabled={entry.existingId != null}
                                                    className={`w-10 h-10 rounded-lg text-sm font-semibold transition-colors ${
                                                        selected
                                                            ? 'bg-[var(--cohe-primary)] text-white'
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
                                            className={`w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-[var(--cohe-text-dark)] focus:outline-none focus:border-[var(--cohe-primary)] focus:ring-1 focus:ring-[var(--cohe-primary)] ${entry.existingId != null ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                                            className={`w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-[var(--cohe-text-dark)] focus:outline-none focus:border-[var(--cohe-primary)] focus:ring-1 focus:ring-[var(--cohe-primary)] ${entry.existingId != null ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        >
                                            {TIME_OPTIONS.map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
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
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Add entry */}
            <button
                type="button"
                onClick={addEntry}
                className="mt-4 text-sm font-medium text-[var(--cohe-primary)] hover:text-[var(--cohe-primary-dark)] transition-colors"
            >
                + 시간대 추가
            </button>

            {/* Errors */}
            {Object.values(errors).map((msg, i) => (
                <p key={i} className="mt-2 text-sm text-red-500">{msg}</p>
            ))}

            {/* Save */}
            <button
                type="button"
                onClick={onSave}
                disabled={isPending}
                className={`w-full mt-6 py-3 rounded-lg font-semibold transition-colors ${
                    isPending
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'cohe-btn-primary'
                }`}
            >
                {isPending ? '저장 중...' : '저장하기'}
            </button>
        </div>
    );
}

import { useEffect, useState } from 'react';
import CoffeeCupIcon from '~/components/icons/CoffeeCupIcon';
import TimeSlotForm, { type TimeSlotEntry } from '~/features/host/components/timeslot/TimeSlotForm';
import WeeklySchedulePreview from '~/features/host/components/timeslot/WeeklySchedulePreview';
import { useCreateTimeslot, useDeleteTimeslot, useMyTimeslots } from '~/features/host';
import type { TimeSlotResponse } from '~/features/host';

const DAY_NAMES: Record<number, string> = { 0: '일', 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토' };

function formatWeekdaySummary(weekdays: number[]): string {
    const sorted = [...weekdays].sort();
    if (sorted.length >= 2) {
        const names = sorted.map((d) => DAY_NAMES[d]);
        return `${names[0]}~${names[names.length - 1]}`;
    }
    return sorted.map((d) => DAY_NAMES[d]).join(', ');
}

/** "HH:mm:ss" | "HH:mm" → "HH:mm" */
function normalizeTime(time: string): string {
    return time.slice(0, 5);
}

function toEntries(timeslots: TimeSlotResponse[]): TimeSlotEntry[] {
    if (timeslots.length === 0) return [];
    return timeslots.map((ts) => ({
        weekdays: ts.weekdays,
        startTime: normalizeTime(ts.startTime),
        endTime: normalizeTime(ts.endTime),
        existingId: ts.id,
    }));
}

const defaultEntry: TimeSlotEntry = {
    weekdays: [1, 2, 3, 4, 5],
    startTime: '09:00',
    endTime: '18:00',
};

export default function TimeSlotSettings() {
    const [entries, setEntries] = useState<TimeSlotEntry[]>([{ ...defaultEntry }]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [initialized, setInitialized] = useState(false);

    const { data: existingTimeslots, isLoading } = useMyTimeslots();
    const createTimeslotMutation = useCreateTimeslot();
    const deleteTimeslotMutation = useDeleteTimeslot();

    // 기존 타임슬롯을 폼에 반영
    useEffect(() => {
        if (initialized || !existingTimeslots) return;
        const loaded = toEntries(existingTimeslots);
        if (loaded.length > 0) {
            setEntries(loaded);
            // 마지막 저장 시간 = 가장 최근 updatedAt
            const latestUpdate = existingTimeslots
                .map((ts) => new Date(ts.updatedAt))
                .sort((a, b) => b.getTime() - a.getTime())[0];
            if (latestUpdate) setLastSaved(latestUpdate);
        }
        setInitialized(true);
    }, [existingTimeslots, initialized]);

    const newEntries = entries.filter((e) => e.existingId == null);
    const hasNewEntries = newEntries.length > 0;

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!hasNewEntries) {
            newErrors.general = '저장할 새 시간대가 없습니다.';
            setErrors(newErrors);
            return false;
        }
        newEntries.forEach((entry, i) => {
            if (entry.weekdays.length === 0) {
                newErrors[`weekdays_${i}`] = `새 시간대: 요일을 최소 1개 이상 선택해주세요.`;
            }
            if (entry.startTime >= entry.endTime) {
                newErrors[`time_${i}`] = `새 시간대: 시작 시간은 종료 시간보다 빨라야 합니다.`;
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        try {
            for (const entry of newEntries) {
                await createTimeslotMutation.mutateAsync({
                    startTime: `${entry.startTime}:00`,
                    endTime: `${entry.endTime}:00`,
                    weekdays: entry.weekdays,
                });
            }
            setLastSaved(new Date());
            setInitialized(false); // 재로드하여 새 타임슬롯에 existingId 부여
        } catch (err) {
            const message = err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.';
            setErrors({ save: message });
        }
    };

    const handleDelete = async (existingId: number) => {
        try {
            await deleteTimeslotMutation.mutateAsync(existingId);
            setInitialized(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.';
            setErrors({ delete: message });
        }
    };

    const summaryText = entries
        .map((e) => `${formatWeekdaySummary(e.weekdays)}, ${e.startTime} - ${e.endTime}`)
        .join(' / ');

    if (isLoading) {
        return (
            <div className="w-full min-h-screen bg-[var(--cohe-bg-light)] flex items-center justify-center">
                <p className="text-gray-500">불러오는 중...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-[var(--cohe-bg-light)]">
            {/* Header */}
            <header className="w-full px-6 py-4 flex justify-between items-center bg-[var(--cohe-bg-warm)]/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <CoffeeCupIcon className="w-8 h-8 text-[var(--cohe-primary)]" />
                    <span className="text-xl font-bold text-[var(--cohe-text-dark)]">coheChat</span>
                </div>
                <nav className="text-sm text-gray-500">
                    <span>호스트 대시보드</span>
                    <span className="mx-1.5">&gt;</span>
                    <span>설정</span>
                    <span className="mx-1.5">&gt;</span>
                    <span className="text-[var(--cohe-text-dark)] font-medium">예약 가능 시간 설정</span>
                </nav>
                <div className="w-9 h-9 rounded-full bg-[var(--cohe-bg-warm)] flex items-center justify-center">
                    <span className="text-sm text-[var(--cohe-primary)]">👤</span>
                </div>
            </header>

            {/* Content */}
            <main className="w-full px-6 py-8 pb-20">
                <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
                    <div className="w-full lg:w-[400px] flex-shrink-0">
                        <TimeSlotForm
                            entries={entries}
                            onChange={setEntries}
                            onSave={handleSave}
                            onDelete={handleDelete}
                            isPending={createTimeslotMutation.isPending}
                            isDeleting={deleteTimeslotMutation.isPending}
                            errors={errors}
                        />
                    </div>
                    <div className="flex-1">
                        <WeeklySchedulePreview entries={entries} />
                    </div>
                </div>
            </main>

            {/* Bottom status bar */}
            <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
                <div className="max-w-6xl mx-auto flex justify-between items-center text-sm text-gray-500">
                    <span>현재 설정: {summaryText}</span>
                    {lastSaved && (
                        <span>
                            마지막 저장: {lastSaved.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}{' '}
                            {lastSaved.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </div>
            </footer>
        </div>
    );
}

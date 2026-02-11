import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import CoffeeCupIcon from '~/components/icons/CoffeeCupIcon';
import TimeSlotForm, { type TimeSlotEntry } from '~/features/host/components/timeslot/TimeSlotForm';
import WeeklySchedulePreview from '~/features/host/components/timeslot/WeeklySchedulePreview';
import { useCreateTimeslot, useDeleteTimeslot, useMyTimeslots } from '~/features/host';
import type { TimeSlotResponse } from '~/features/host';

const DAY_NAMES: Record<number, string> = { 0: '일', 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토' };

function formatWeekdaySummary(weekdays: number[]): string {
    const sorted = [...weekdays].sort((a, b) => a - b);
    if (sorted.length === 0) return '';
    const names = sorted.map((d) => DAY_NAMES[d]);
    const isConsecutive = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1);
    if (isConsecutive && sorted.length >= 2) {
        return `${names[0]}~${names[names.length - 1]}`;
    }
    return names.join(', ');
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
        startDate: ts.startDate ?? undefined,
        endDate: ts.endDate ?? undefined,
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
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const syncedRef = useRef(false);

    const { data: existingTimeslots, isLoading, error: loadError, refetch } = useMyTimeslots();
    const createTimeslotMutation = useCreateTimeslot();
    const deleteTimeslotMutation = useDeleteTimeslot();

    // 서버 데이터를 폼에 반영 (초기 로드 및 mutation 후 재동기화)
    useEffect(() => {
        if (!existingTimeslots || syncedRef.current) return;
        const loaded = toEntries(existingTimeslots);
        if (loaded.length > 0) {
            setEntries(loaded);
            const latestUpdate = existingTimeslots
                .map((ts) => new Date(ts.updatedAt))
                .sort((a, b) => b.getTime() - a.getTime())[0];
            if (latestUpdate) setLastSaved(latestUpdate);
        }
        syncedRef.current = true;
    }, [existingTimeslots]);

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
            if (entry.startDate && entry.endDate && entry.startDate > entry.endDate) {
                newErrors[`date_${i}`] = `새 시간대: 시작 날짜는 종료 날짜보다 빨라야 합니다.`;
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        const results = await Promise.allSettled(
            newEntries.map((entry) =>
                createTimeslotMutation.mutateAsync({
                    startTime: `${entry.startTime}:00`,
                    endTime: `${entry.endTime}:00`,
                    weekdays: entry.weekdays,
                    ...(entry.startDate && entry.endDate ? { startDate: entry.startDate, endDate: entry.endDate } : {}),
                })
            )
        );
        const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
        if (failures.length > 0) {
            const reasons = failures.map((f) => f.reason instanceof Error ? f.reason.message : '알 수 없는 오류');
            const uniqueReasons = [...new Set(reasons)];
            setErrors({ save: uniqueReasons.join(', ') });
        } else {
            setErrors({});
        }
        setLastSaved(new Date());
        syncedRef.current = false;
        refetch();
    };

    const handleDelete = async (existingId: number) => {
        try {
            setDeletingId(existingId);
            await deleteTimeslotMutation.mutateAsync(existingId);
            syncedRef.current = false;
            refetch();
        } catch (err) {
            const message = err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.';
            setErrors({ delete: message });
        } finally {
            setDeletingId(null);
        }
    };

    const summaryText = entries
        .map((e) => `${formatWeekdaySummary(e.weekdays)}, ${e.startTime} - ${e.endTime}`)
        .join(' / ');

    const isCalendarMissing = loadError != null && (loadError as Error).cause === 404;

    if (isLoading) {
        return (
            <div className="w-full min-h-screen bg-[var(--cohe-bg-light)] flex items-center justify-center">
                <p className="text-gray-500">불러오는 중...</p>
            </div>
        );
    }

    if (isCalendarMissing) {
        return (
            <div className="w-full min-h-screen bg-[var(--cohe-bg-light)] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-lg text-gray-700">캘린더를 먼저 연동해야 시간대를 설정할 수 있습니다.</p>
                    <Link
                        to="/app/host/register"
                        className="inline-block px-6 py-2.5 rounded-lg font-medium cohe-btn-primary"
                    >
                        캘린더 연동하기
                    </Link>
                </div>
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
                            deletingId={deletingId}
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

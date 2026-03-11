import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '~/components/card';
import { Header } from '~/components/header';
import { useToast } from '~/components/toast/useToast';
import TimeSlotForm, { type TimeSlotEntry } from '~/features/host/components/timeslot/TimeSlotForm';
import WeeklySchedulePreview from '~/features/host/components/timeslot/WeeklySchedulePreview';
import { useCreateTimeslot, useDeleteTimeslot, useMyTimeslots } from '~/features/host';
import type { TimeSlotResponse } from '~/features/host';
import { useAuth, useUpdateProfile } from '~/features/member';
import { useHost } from '~/hooks/useHost';
import Button from '~/components/button/Button';
import LinkButton from '~/components/button/LinkButton';
import { getErrorMessage } from '~/libs/errorUtils';
import { DAY_NAMES, type Weekday } from '~/libs/constants/days';
const PROFILE_SAVE_SUCCESS_DURATION = 3000;

function formatWeekdaySummary(weekdays: number[]): string {
    const sorted = [...weekdays].sort((a, b) => a - b);
    if (sorted.length === 0) return '';
    const names = sorted.map((d) => DAY_NAMES[d as Weekday]);
    const isConsecutive = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1);
    if (isConsecutive && sorted.length >= 2) {
        return names[0] + '~' + names[names.length - 1];
    }
    return names.join(', ');
}

function normalizeTime(time: string): string {
    return time.slice(0, 5);
}

function toEntries(timeslots: TimeSlotResponse[]): TimeSlotEntry[] {
    if (timeslots.length === 0) return [];
    return timeslots.map((ts) => ({
        weekdays: ts.weekdays,
        startTime: normalizeTime(ts.startedAt),
        endTime: normalizeTime(ts.endedAt),
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

    const { data: user } = useAuth();
    const { data: hostProfile } = useHost(user?.username ?? '');
    const [job, setJob] = useState('');
    const [profileImageUrl, setProfileImageUrl] = useState('');
    const [profileSaved, setProfileSaved] = useState(false);
    const updateProfileMutation = useUpdateProfile();
    const profileSavedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (profileSavedTimerRef.current) clearTimeout(profileSavedTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (hostProfile) {
            setJob(hostProfile.job ?? '');
            setProfileImageUrl(hostProfile.profileImageUrl ?? '');
        }
    }, [hostProfile]);

    const handleProfileSave = async () => {
        try {
            await updateProfileMutation.mutateAsync({
                job: job || undefined,
                profileImageUrl: profileImageUrl || undefined,
            });
            setProfileSaved(true);
            if (profileSavedTimerRef.current) clearTimeout(profileSavedTimerRef.current);
            profileSavedTimerRef.current = setTimeout(() => setProfileSaved(false), PROFILE_SAVE_SUCCESS_DURATION);
        } catch {
            // 에러는 updateProfileMutation.isError / error로 표시
        }
    };

    const { showToast } = useToast();
    const handleDuplicateBlocked = () => {
        showToast('이미 존재하는 시간대와 겹쳐서 추가되지 않았어요.', 'duplicate-timeslot');
    };

    const { data: existingTimeslots, isLoading, error: loadError } = useMyTimeslots();
    const createTimeslotMutation = useCreateTimeslot();
    const deleteTimeslotMutation = useDeleteTimeslot();

    useEffect(() => {
        if (!existingTimeslots || syncedRef.current) return;
        const loaded = toEntries(existingTimeslots);
        if (loaded.length > 0) {
            setEntries(loaded);
            const latestUpdate = existingTimeslots
                .map((ts) => new Date(ts.updatedAt))
                .sort((a, b) => b.getTime() - a.getTime())[0];
            if (latestUpdate) setLastSaved(latestUpdate);
        } else {
            setEntries([{ ...defaultEntry }]);
        }
        syncedRef.current = true;
    }, [existingTimeslots]);

    const newEntries = useMemo(() => entries.filter((e) => e.existingId == null), [entries]);
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
                newErrors['weekdays_' + i] = '새 시간대: 요일을 최소 1개 이상 선택해주세요.';
            }
            if (entry.startTime >= entry.endTime) {
                newErrors['time_' + i] = '새 시간대: 시작 시간은 종료 시간보다 빨라야 합니다.';
            }
            if ((entry.startDate && !entry.endDate) || (!entry.startDate && entry.endDate)) {
                newErrors['date_' + i] = '새 시간대: 시작 날짜와 종료 날짜를 모두 입력하거나 모두 비워두세요.';
            } else if (entry.startDate && entry.endDate && entry.startDate > entry.endDate) {
                newErrors['date_' + i] = '새 시간대: 시작 날짜는 종료 날짜보다 빨라야 합니다.';
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
                    startTime: entry.startTime + ':00',
                    endTime: entry.endTime + ':00',
                    weekdays: entry.weekdays,
                    ...(entry.startDate && entry.endDate ? { startDate: entry.startDate, endDate: entry.endDate } : {}),
                })
            )
        );

        const failures = results
            .map((r, i) => ({ result: r, entry: newEntries[i] }))
            .filter((item): item is { result: PromiseRejectedResult; entry: TimeSlotEntry } => item.result.status === 'rejected');

        if (failures.length > 0) {
            const reasons = failures.map((f) => {
                const label = f.entry.startTime + '~' + f.entry.endTime;
                const msg = f.result.reason instanceof Error ? f.result.reason.message : '알 수 없는 오류';
                return '[' + label + '] ' + msg;
            });
            setErrors({ save: reasons.join(', ') });
        } else {
            setErrors({});
        }
        if (failures.length === 0) {
            setLastSaved(new Date());
        }
        syncedRef.current = false;
    };

    const handleDelete = async (existingId: number) => {
        try {
            setDeletingId(existingId);
            await deleteTimeslotMutation.mutateAsync(existingId);
            setEntries((prev) => {
                const remaining = prev.filter((e) => e.existingId !== existingId);
                return remaining.length > 0 ? remaining : [{ ...defaultEntry }];
            });
            syncedRef.current = false;
        } catch (err) {
            setErrors({ delete: getErrorMessage(err, '삭제 중 오류가 발생했습니다.') });
        } finally {
            setDeletingId(null);
        }
    };

    const handlePreviewDelete = (entry: TimeSlotEntry, index: number) => {
        if (entry.existingId != null) {
            void handleDelete(entry.existingId);
            return;
        }

        setEntries((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
    };

    const summaryText = entries
        .map((e) => formatWeekdaySummary(e.weekdays) + ', ' + e.startTime + ' - ' + e.endTime)
        .join(' / ');

    const isCalendarMissing = loadError != null && (loadError as Error).cause === 404;

    if (isLoading) {
        return (
            <div className="w-full min-h-screen bg-[var(--cohi-bg-light)] flex items-center justify-center">
                <p className="text-gray-500">불러오는 중...</p>
            </div>
        );
    }

    if (isCalendarMissing) {
        return (
            <div className="w-full min-h-screen bg-[var(--cohi-bg-light)] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-lg text-gray-700">캘린더를 먼저 연동해야 시간대를 설정할 수 있습니다.</p>
                    <LinkButton variant="primary" to="/host/register">
                        캘린더 연동하기
                    </LinkButton>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-[var(--cohi-bg-light)]">
            <Header
                center={
                    <nav className="text-sm text-gray-500">
                        <span>호스트 대시보드</span>
                        <span className="mx-1.5">&gt;</span>
                        <span className="text-[var(--cohi-text-dark)] font-medium">시간대 설정</span>
                    </nav>
                }
                right={
                    <div className="w-9 h-9 rounded-full bg-[var(--cohi-bg-warm)] flex items-center justify-center">
                        <span className="text-sm text-[var(--cohi-primary)]">👤</span>
                    </div>
                }
            />

            <main className="w-full px-6 py-8 pb-20">
                <div className="max-w-6xl mx-auto space-y-8">
                    <Card title="내 프로필">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">직업 / 소개</label>
                                <input
                                    type="text"
                                    value={job}
                                    onChange={(e) => setJob(e.target.value)}
                                    placeholder="예: 백엔드 개발자 @ 스타트업"
                                    maxLength={100}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cohi-primary)]/30 focus:border-[var(--cohi-primary)]"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">프로필 이미지 URL</label>
                                <input
                                    type="url"
                                    value={profileImageUrl}
                                    onChange={(e) => setProfileImageUrl(e.target.value)}
                                    placeholder="https://..."
                                    maxLength={500}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cohi-primary)]/30 focus:border-[var(--cohi-primary)]"
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button
                                    variant="primary"
                                    onClick={handleProfileSave}
                                    loading={updateProfileMutation.isPending}
                                >
                                    저장
                                </Button>
                                {profileSaved && (
                                    <span className="text-sm text-green-600 whitespace-nowrap">저장됐어요!</span>
                                )}
                            </div>
                        </div>
                        {updateProfileMutation.isError && (
                            <p className="mt-2 text-sm text-red-500">{updateProfileMutation.error.message}</p>
                        )}
                    </Card>

                    <div className="flex flex-col lg:flex-row gap-8">
                        <div className="w-full lg:w-[400px] flex-shrink-0">
                            <TimeSlotForm
                                entries={entries}
                                onChange={setEntries}
                                onSave={handleSave}
                                onDelete={handleDelete}
                                onOverlapDetected={handleDuplicateBlocked}
                                isPending={createTimeslotMutation.isPending}
                                deletingId={deletingId}
                                errors={errors}
                            />
                        </div>
                        <div className="flex-1">
                            <WeeklySchedulePreview
                                entries={entries}
                                onChange={setEntries}
                                onDuplicateBlocked={handleDuplicateBlocked}
                                onDeleteEntry={handlePreviewDelete}
                            />
                        </div>
                    </div>
                </div>
            </main>

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

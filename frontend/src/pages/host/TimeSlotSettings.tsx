import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '~/components/card';
import { PageLayout } from '~/components';
import { useToast } from '~/components/toast/useToast';
import { TimeSlotForm, type TimeSlotEntry } from '~/features/host/components/timeslot/TimeSlotForm';
import { WeeklySchedulePreview } from '~/features/host/components/timeslot/WeeklySchedulePreview';
import { useCreateTimeslot, useDeleteTimeslot, useMyTimeslots } from '~/features/host';
import type { TimeSlotResponse } from '~/features/host';
import { useAuth, useUpdateProfile } from '~/features/member';
import { useHost } from '~/hooks/useHost';
import { Button } from '~/components/button';
import { LinkButton } from '~/components/button/LinkButton';
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

function normalizeTime(time?: string | null): string {
    return typeof time === 'string' ? time.slice(0, 5) : '';
}

function readTimeslotStart(ts: TimeSlotResponse): string {
    return normalizeTime(
        ('startedAt' in ts ? ts.startedAt : undefined) ??
        ('startTime' in (ts as TimeSlotResponse & { startTime?: string }) ? (ts as TimeSlotResponse & { startTime?: string }).startTime : undefined) ??
        null,
    );
}

function readTimeslotEnd(ts: TimeSlotResponse): string {
    return normalizeTime(
        ('endedAt' in ts ? ts.endedAt : undefined) ??
        ('endTime' in (ts as TimeSlotResponse & { endTime?: string }) ? (ts as TimeSlotResponse & { endTime?: string }).endTime : undefined) ??
        null,
    );
}

function toEntries(timeslots: TimeSlotResponse[]): TimeSlotEntry[] {
    if (timeslots.length === 0) return [];
    return timeslots
        .map((ts) => ({
            weekdays: ts.weekdays,
            startTime: readTimeslotStart(ts),
            endTime: readTimeslotEnd(ts),
            startDate: ts.startDate ?? undefined,
            endDate: ts.endDate ?? undefined,
            existingId: ts.id,
        }))
        .filter((entry) => entry.startTime && entry.endTime);
}

export function TimeSlotSettings() {
    const [entries, setEntries] = useState<TimeSlotEntry[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const deletingIdsRef = useRef<Set<number>>(new Set());
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
        setEntries(loaded);
        const latestUpdate = existingTimeslots
            .map((ts) => new Date(ts.updatedAt))
            .sort((a, b) => b.getTime() - a.getTime())[0];
        if (latestUpdate) setLastSaved(latestUpdate);
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
        if (deletingIdsRef.current.has(existingId)) return;
        deletingIdsRef.current.add(existingId);

        try {
            setDeletingId(existingId);
            await deleteTimeslotMutation.mutateAsync(existingId);
            setEntries((prev) => prev.filter((e) => e.existingId !== existingId));
            syncedRef.current = false;
        } catch (err) {
            setErrors({ delete: getErrorMessage(err, '삭제 중 오류가 발생했습니다.') });
        } finally {
            deletingIdsRef.current.delete(existingId);
            setDeletingId((current) => (current === existingId ? null : current));
        }
    };

    const handlePreviewDelete = (entry: TimeSlotEntry, index: number) => {
        if (entry.existingId != null) {
            void handleDelete(entry.existingId);
            return;
        }

        setEntries((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
    };

    const summaryText = entries.length > 0
        ? entries
            .map((e) => formatWeekdaySummary(e.weekdays) + ', ' + e.startTime + ' - ' + e.endTime)
            .join(' / ')
        : '설정된 시간대 없음';

    const isCalendarMissing = loadError != null && (loadError as Error).cause === 404;

    if (isLoading) {
        return (
            <PageLayout title="시간대 설정">
                <div className="flex items-center justify-center py-20">
                    <p className="text-gray-500">불러오는 중...</p>
                </div>
            </PageLayout>
        );
    }

    if (isCalendarMissing) {
        return (
            <PageLayout title="시간대 설정">
                <div className="flex items-center justify-center py-12">
                    <Card size="lg" className="flex flex-col p-10 text-center max-w-md space-y-6">
                        <div className="text-5xl">⏰</div>
                        <h2 className="text-xl font-bold text-[var(--cohi-text-dark)]">연동된 캘린더가 없습니다</h2>
                        <p className="text-gray-600">
                            시간대를 설정하려면 먼저 Google 캘린더를 연동해야 합니다.
                        </p>
                        <LinkButton variant="primary" to="/host/register" size="lg" className="w-full">
                            캘린더 연동하기
                        </LinkButton>
                    </Card>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout title="시간대 설정" className="pb-20">
                <div className="space-y-8">
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
                        <div className="w-full flex-1">
                            <WeeklySchedulePreview
                                entries={entries}
                                onChange={setEntries}
                                onDuplicateBlocked={handleDuplicateBlocked}
                                onDeleteEntry={handlePreviewDelete}
                            />
                        </div>
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
                    </div>
                </div>

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
        </PageLayout>
    );
}

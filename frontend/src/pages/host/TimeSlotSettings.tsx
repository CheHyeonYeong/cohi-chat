import { useEffect, useMemo, useRef, useState } from 'react';
import { PageLayout } from '~/components';
import { Button } from '~/components/button';
import { LinkButton } from '~/components/button/LinkButton';
import { Card } from '~/components/card';
import { useToast } from '~/components/toast/useToast';
import { TimeSlotForm, WeeklySchedulePreview, type TimeSlotEntry } from '~/features/host/components/timeslot';
import {
    useCreateTimeslot,
    useDeleteTimeslot,
    useMyTimeslots,
    useUpdateTimeslot,
    type TimeSlotCreatePayload,
    type TimeSlotResponse,
} from '~/features/host';
import { useAuth, useUpdateProfile } from '~/features/member';
import { useHost } from '~/hooks/useHost';
import { DAY_NAMES, type Weekday } from '~/libs/constants/days';

const PROFILE_SAVE_SUCCESS_DURATION = 3000;

function formatWeekdaySummary(weekdays: number[]): string {
    const sorted = [...weekdays].sort((a, b) => a - b);
    if (sorted.length === 0) return '';
    const names = sorted.map((day) => DAY_NAMES[day as Weekday]);
    const isConsecutive = sorted.every((day, index) => index === 0 || day === sorted[index - 1] + 1);
    return isConsecutive && sorted.length >= 2 ? `${names[0]}~${names[names.length - 1]}` : names.join(', ');
}

function normalizeTime(value?: string | null): string {
    return typeof value === 'string' ? value.slice(0, 5) : '';
}

function readTimeslotStart(timeslot: TimeSlotResponse): string {
    return normalizeTime(
        ('startedAt' in timeslot ? timeslot.startedAt : undefined) ??
            ('startTime' in (timeslot as TimeSlotResponse & { startTime?: string })
                ? (timeslot as TimeSlotResponse & { startTime?: string }).startTime
                : undefined) ??
            null,
    );
}

function readTimeslotEnd(timeslot: TimeSlotResponse): string {
    return normalizeTime(
        ('endedAt' in timeslot ? timeslot.endedAt : undefined) ??
            ('endTime' in (timeslot as TimeSlotResponse & { endTime?: string })
                ? (timeslot as TimeSlotResponse & { endTime?: string }).endTime
                : undefined) ??
            null,
    );
}

function toEntry(timeslot: TimeSlotResponse): TimeSlotEntry | null {
    const startTime = readTimeslotStart(timeslot);
    const endTime = readTimeslotEnd(timeslot);
    if (!startTime || !endTime) return null;

    return {
        weekdays: timeslot.weekdays,
        startTime,
        endTime,
        startDate: timeslot.startDate ?? undefined,
        endDate: timeslot.endDate ?? undefined,
        existingId: timeslot.id,
    };
}

function toEntries(timeslots: TimeSlotResponse[]): TimeSlotEntry[] {
    return timeslots.map(toEntry).filter((entry): entry is TimeSlotEntry => entry != null);
}

function buildPayload(entry: TimeSlotEntry): TimeSlotCreatePayload {
    return {
        startTime: `${entry.startTime}:00`,
        endTime: `${entry.endTime}:00`,
        weekdays: entry.weekdays,
        ...(entry.startDate && entry.endDate ? { startDate: entry.startDate, endDate: entry.endDate } : {}),
    };
}

function areEntriesEqual(left: TimeSlotEntry, right: TimeSlotEntry): boolean {
    const leftWeekdays = [...left.weekdays].sort((a, b) => a - b);
    const rightWeekdays = [...right.weekdays].sort((a, b) => a - b);
    return (
        left.startTime === right.startTime &&
        left.endTime === right.endTime &&
        left.startDate === right.startDate &&
        left.endDate === right.endDate &&
        leftWeekdays.length === rightWeekdays.length &&
        leftWeekdays.every((value, index) => value === rightWeekdays[index])
    );
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

    const { showToast } = useToast();
    const { data: existingTimeslots, isLoading, error: loadError } = useMyTimeslots();
    const createTimeslotMutation = useCreateTimeslot();
    const updateTimeslotMutation = useUpdateTimeslot();
    const deleteTimeslotMutation = useDeleteTimeslot();

    useEffect(() => {
        return () => {
            if (profileSavedTimerRef.current) clearTimeout(profileSavedTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (!hostProfile) return;
        setJob(hostProfile.job ?? '');
        setProfileImageUrl(hostProfile.profileImageUrl ?? '');
    }, [hostProfile]);

    useEffect(() => {
        if (!existingTimeslots || syncedRef.current) return;
        setEntries(toEntries(existingTimeslots));
        const latestUpdate = existingTimeslots
            .map((timeslot) => new Date(timeslot.updatedAt))
            .sort((a, b) => b.getTime() - a.getTime())[0];
        if (latestUpdate) setLastSaved(latestUpdate);
        syncedRef.current = true;
    }, [existingTimeslots]);

    const originalEntriesById = useMemo(() => {
        const map = new Map<number, TimeSlotEntry>();
        (existingTimeslots ?? []).forEach((timeslot) => {
            const entry = toEntry(timeslot);
            if (entry && entry.existingId != null) {
                map.set(entry.existingId, entry);
            }
        });
        return map;
    }, [existingTimeslots]);

    const newEntries = useMemo(() => entries.filter((entry) => entry.existingId == null), [entries]);
    const changedExistingEntries = useMemo(
        () =>
            entries.filter((entry) => {
                if (entry.existingId == null) return false;
                const original = originalEntriesById.get(entry.existingId);
                return original ? !areEntriesEqual(entry, original) : false;
            }),
        [entries, originalEntriesById],
    );
    const removedExistingEntries = useMemo(
        () =>
            Array.from(originalEntriesById.values()).filter(
                (originalEntry) =>
                    !entries.some((entry) => entry.existingId != null && entry.existingId === originalEntry.existingId),
            ),
        [entries, originalEntriesById],
    );

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
            // Error message is rendered from the mutation state.
        }
    };

    const handleDuplicateBlocked = () => {
        showToast('이미 존재하는 시간대와 겹쳐서 추가되지 않았어요.', 'duplicate-timeslot');
    };

    const validate = (): boolean => {
        const nextErrors: Record<string, string> = {};
        if (newEntries.length === 0 && changedExistingEntries.length === 0 && removedExistingEntries.length === 0) {
            nextErrors.general = '저장할 변경 사항이 없습니다.';
            setErrors(nextErrors);
            return false;
        }

        entries.forEach((entry, index) => {
            if (entry.weekdays.length === 0) {
                nextErrors[`weekdays_${index}`] = '요일을 최소 1개 이상 선택해주세요.';
            }
            if (entry.startTime >= entry.endTime) {
                nextErrors[`time_${index}`] = '시작 시간은 종료 시간보다 빨라야 합니다.';
            }
            if ((entry.startDate && !entry.endDate) || (!entry.startDate && entry.endDate)) {
                nextErrors[`date_${index}`] = '시작 날짜와 종료 날짜를 모두 입력하거나 모두 비워두세요.';
            } else if (entry.startDate && entry.endDate && entry.startDate > entry.endDate) {
                nextErrors[`date_${index}`] = '시작 날짜는 종료 날짜보다 빨라야 합니다.';
            }
        });

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        const deleteOperations = removedExistingEntries.map((entry) => ({
            label: `${entry.startTime}~${entry.endTime}`,
            run: () => deleteTimeslotMutation.mutateAsync(entry.existingId!),
        }));
        const updateOperations = changedExistingEntries.map((entry) => ({
            label: `${entry.startTime}~${entry.endTime}`,
            run: () =>
                updateTimeslotMutation.mutateAsync({
                    id: entry.existingId!,
                    payload: buildPayload(entry),
                }),
        }));
        const createOperations = newEntries.map((entry) => ({
            label: `${entry.startTime}~${entry.endTime}`,
            run: () => createTimeslotMutation.mutateAsync(buildPayload(entry)),
        }));

        const results: Array<{
            result: PromiseSettledResult<unknown>;
            operation: { label: string; run: () => Promise<unknown> };
        }> = [];

        for (const operations of [deleteOperations, updateOperations, createOperations]) {
            for (const operation of operations) {
                try {
                    await operation.run();
                    results.push({ result: { status: 'fulfilled', value: undefined }, operation });
                } catch (reason) {
                    results.push({ result: { status: 'rejected', reason }, operation });
                }
            }
        }

        const failures = results.filter(
            (item): item is { result: PromiseRejectedResult; operation: { label: string; run: () => Promise<unknown> } } =>
                item.result.status === 'rejected',
        );

        if (failures.length > 0) {
            setErrors({
                save: failures
                    .map(({ result, operation }) => {
                        const message = result.reason instanceof Error ? result.reason.message : '알 수 없는 오류';
                        return `[${operation.label}] ${message}`;
                    })
                    .join(', '),
            });
        } else {
            setErrors({});
            setLastSaved(new Date());
        }

        if (results.some((result) => result.status === 'fulfilled')) {
            syncedRef.current = false;
        }
    };

    const handleDelete = async (existingId: number) => {
        if (deletingIdsRef.current.has(existingId)) return;
        setErrors((current) => {
            const { delete: _delete, general: _general, ...rest } = current;
            return rest;
        });
        setEntries((prev) => prev.filter((entry) => entry.existingId !== existingId));
    };

    const handlePreviewDelete = (entry: TimeSlotEntry, index: number) => {
        if (entry.existingId != null) {
            void handleDelete(entry.existingId);
            return;
        }
        setEntries((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
    };

    const summaryText =
        entries.length > 0
            ? entries.map((entry) => `${formatWeekdaySummary(entry.weekdays)}, ${entry.startTime} - ${entry.endTime}`).join(' / ')
            : '설정된 시간대 없음';

    const isCalendarMissing = loadError != null && (loadError as Error).cause === 404;
    const isSaving = createTimeslotMutation.isPending || updateTimeslotMutation.isPending || deleteTimeslotMutation.isPending;

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
                    <Card size="lg" className="flex max-w-md flex-col space-y-6 p-10 text-center">
                        <div className="text-5xl">!</div>
                        <h2 className="text-xl font-bold text-[var(--cohi-text-dark)]">연동된 캘린더가 없습니다</h2>
                        <p className="text-gray-600">시간대를 설정하려면 먼저 Google 캘린더를 연동해야 합니다.</p>
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
                    <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="flex-1">
                            <label className="mb-1 block text-sm font-medium text-gray-700">직업 / 소개</label>
                            <input
                                type="text"
                                value={job}
                                onChange={(event) => setJob(event.target.value)}
                                placeholder="예: 백엔드 개발자 @ 스타트업"
                                maxLength={100}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--cohi-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--cohi-primary)]/30"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="mb-1 block text-sm font-medium text-gray-700">프로필 이미지 URL</label>
                            <input
                                type="url"
                                value={profileImageUrl}
                                onChange={(event) => setProfileImageUrl(event.target.value)}
                                placeholder="https://..."
                                maxLength={500}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--cohi-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--cohi-primary)]/30"
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <Button variant="primary" onClick={handleProfileSave} loading={updateProfileMutation.isPending}>
                                저장
                            </Button>
                            {profileSaved && <span className="whitespace-nowrap text-sm text-green-600">저장됐어요!</span>}
                        </div>
                    </div>
                    {updateProfileMutation.isError && (
                        <p className="mt-2 text-sm text-red-500">{updateProfileMutation.error.message}</p>
                    )}
                </Card>

                <div className="flex flex-col gap-8 lg:flex-row">
                    <div className="w-full flex-1">
                        <WeeklySchedulePreview
                            entries={entries}
                            onChange={setEntries}
                            onDuplicateBlocked={handleDuplicateBlocked}
                            onDeleteEntry={handlePreviewDelete}
                        />
                    </div>
                    <div className="w-full flex-shrink-0 lg:w-[400px]">
                        <TimeSlotForm
                            entries={entries}
                            onChange={setEntries}
                            onSave={handleSave}
                            onDelete={handleDelete}
                            onOverlapDetected={handleDuplicateBlocked}
                            isPending={isSaving}
                            deletingId={deletingId}
                            errors={errors}
                        />
                    </div>
                </div>
            </div>

            <footer className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-6 py-3">
                <div className="mx-auto flex max-w-6xl items-center justify-between text-sm text-gray-500">
                    <span>현재 설정: {summaryText}</span>
                    {lastSaved && (
                        <span>
                            마지막 저장 {lastSaved.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}{' '}
                            {lastSaved.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </div>
            </footer>
        </PageLayout>
    );
}

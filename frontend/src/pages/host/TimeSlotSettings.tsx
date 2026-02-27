import { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '~/components/header';
import TimeSlotForm, { type TimeSlotEntry } from '~/features/host/components/timeslot/TimeSlotForm';
import WeeklySchedulePreview from '~/features/host/components/timeslot/WeeklySchedulePreview';
import { useCreateTimeslot, useDeleteTimeslot, useMyTimeslots } from '~/features/host';
import type { TimeSlotResponse } from '~/features/host';
import { useAuth, useUpdateProfile } from '~/features/member';
import { useHost } from '~/hooks/useHost';
import Button from '~/components/button/Button';
import LinkButton from '~/components/button/LinkButton';
import { getErrorMessage } from '~/libs/errorUtils';

const DAY_NAMES: Record<number, string> = { 0: '일', 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토' };
const PROFILE_SAVE_SUCCESS_DURATION = 3000;

function formatWeekdaySummary(weekdays: number[]): string {
    const sorted = [...weekdays].sort((a, b) => a - b);
    if (sorted.length === 0) return '';
    const names = sorted.map((d) => DAY_NAMES[d]);
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

    const { data: user } = useAuth();
    const { data: hostProfile } = useHost(user?.username ?? '');
    const [job, setJob] = useState('');
    const [profileImageUrl, setProfileImageUrl] = useState('');
    const [profileSaved, setProfileSaved] = useState(false);
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastKey, setToastKey] = useState(0);
    const updateProfileMutation = useUpdateProfile();
    const profileSavedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const emailCopiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (profileSavedTimerRef.current) clearTimeout(profileSavedTimerRef.current);
            if (emailCopiedTimerRef.current) clearTimeout(emailCopiedTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (hostProfile) {
            setJob(hostProfile.job ?? '');
            setProfileImageUrl(hostProfile.profileImageUrl ?? '');
        }
    }, [hostProfile]);

    const showDuplicateTimeslotToast = useCallback(() => {
        setToastMessage(DUPLICATE_TIMESLOT_TOAST);
        setToastKey((prev) => prev + 1);
        setToastOpen(true);
    }, []);

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
            // ?먮윭??updateProfileMutation.isError / error濡??쒖떆
        }
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
            newErrors.general = '??ν븷 ???쒓컙?媛 ?놁뒿?덈떎.';
            setErrors(newErrors);
            return false;
        }
        newEntries.forEach((entry, i) => {
            if (entry.weekdays.length === 0) {
                newErrors['weekdays_' + i] = '???쒓컙?: ?붿씪??理쒖냼 1媛??댁긽 ?좏깮?댁＜?몄슂.';
            }
            if (entry.startTime >= entry.endTime) {
                newErrors['time_' + i] = '???쒓컙?: ?쒖옉 ?쒓컙? 醫낅즺 ?쒓컙蹂대떎 鍮⑤씪???⑸땲??';
            }
            if ((entry.startDate && !entry.endDate) || (!entry.startDate && entry.endDate)) {
                newErrors['date_' + i] = '???쒓컙?: ?쒖옉 ?좎쭨? 醫낅즺 ?좎쭨瑜?紐⑤몢 ?낅젰?섍굅??紐⑤몢 鍮꾩썙?먯꽭??';
            } else if (entry.startDate && entry.endDate && entry.startDate > entry.endDate) {
                newErrors['date_' + i] = '???쒓컙?: ?쒖옉 ?좎쭨??醫낅즺 ?좎쭨蹂대떎 鍮⑤씪???⑸땲??';
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
                const msg = f.result.reason instanceof Error ? f.result.reason.message : '?????녿뒗 ?ㅻ쪟';
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
            setErrors({ delete: getErrorMessage(err, '??젣 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.') });
        } finally {
            setDeletingId(null);
        }
    };

    const summaryText = entries
        .map((e) => formatWeekdaySummary(e.weekdays) + ', ' + e.startTime + ' - ' + e.endTime)
        .join(' / ');

    const isCalendarMissing = loadError != null && (loadError as Error).cause === 404;

    if (isLoading) {
        return (
            <div className="w-full min-h-screen bg-[var(--cohe-bg-light)] flex items-center justify-center">
                <p className="text-gray-500">遺덈윭?ㅻ뒗 以?..</p>
            </div>
        );
    }

    if (isCalendarMissing) {
        return (
            <div className="w-full min-h-screen bg-[var(--cohe-bg-light)] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-lg text-gray-700">罹섎┛?붾? 癒쇱? ?곕룞?댁빞 ?쒓컙?瑜??ㅼ젙?????덉뒿?덈떎.</p>
                    <LinkButton variant="primary" to="/host/register">
                        罹섎┛???곕룞?섍린
                    </LinkButton>
                </div>
            </div>
        );
    }

    return (
        <Toast.Provider swipeDirection="right">
            <div className="w-full min-h-screen bg-[var(--cohe-bg-light)]">
            <Header
                center={
                    <nav className="text-sm text-gray-500">
                        <span>?몄뒪????쒕낫??/span>
                        <span className="mx-1.5">&gt;</span>
                        <span className="text-[var(--cohe-text-dark)] font-medium">?쒓컙? ?ㅼ젙</span>
                    </nav>
                }
                right={
                    <div className="w-9 h-9 rounded-full bg-[var(--cohe-bg-warm)] flex items-center justify-center">
                        <span className="text-sm text-[var(--cohe-primary)]">?뫀</span>
                    </div>
                }
            />

            <main className="w-full px-6 py-8 pb-20">
                <div className="max-w-6xl mx-auto space-y-8">
                    <section className="bg-white rounded-2xl p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-[var(--cohe-text-dark)] mb-4">???꾨줈??/h2>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">吏곸뾽 / ?뚭컻</label>
                                <input
                                    type="text"
                                    value={job}
                                    onChange={(e) => setJob(e.target.value)}
                                    placeholder="?? 諛깆뿏??媛쒕컻??@ ?ㅽ??몄뾽"
                                    maxLength={100}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cohe-primary)]/30 focus:border-[var(--cohe-primary)]"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">?꾨줈???대?吏 URL</label>
                                <input
                                    type="url"
                                    value={profileImageUrl}
                                    onChange={(e) => setProfileImageUrl(e.target.value)}
                                    placeholder="https://..."
                                    maxLength={500}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cohe-primary)]/30 focus:border-[var(--cohe-primary)]"
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button
                                    variant="primary"
                                    onClick={handleProfileSave}
                                    loading={updateProfileMutation.isPending}
                                >
                                    ???                                </Button>
                                {profileSaved && (
                                    <span className="text-sm text-green-600 whitespace-nowrap">??λ릱?댁슂!</span>
                                )}
                            </div>
                        </div>
                        {updateProfileMutation.isError && (
                            <p className="mt-2 text-sm text-red-500">{updateProfileMutation.error.message}</p>
                        )}
                    </section>

                    <div className="flex flex-col lg:flex-row gap-8">
                        <div className="w-full lg:w-[400px] flex-shrink-0">
                            <TimeSlotForm
                                entries={entries}
                                onChange={setEntries}
                                onSave={handleSave}
                                onDelete={handleDelete}
                                onOverlapDetected={showDuplicateTimeslotToast}
                                isPending={createTimeslotMutation.isPending}
                                deletingId={deletingId}
                                errors={errors}
                            />
                        </div>
                        <div className="flex-1">
                            <WeeklySchedulePreview
                                entries={entries}
                                onChange={setEntries}
                                onDuplicateBlocked={showDuplicateTimeslotToast}
                            />
                        </div>
                    </div>
                </div>
            </main>

            <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
                <div className="max-w-6xl mx-auto flex justify-between items-center text-sm text-gray-500">
                    <span>?꾩옱 ?ㅼ젙: {summaryText}</span>
                    {lastSaved && (
                        <span>
                            留덉?留???? {lastSaved.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}{' '}
                            {lastSaved.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </div>
            </footer>
            </div>

            <Toast.Root
                key={toastKey}
                open={toastOpen}
                onOpenChange={setToastOpen}
                duration={2500}
                className="rounded-lg border border-red-200 bg-white px-4 py-3 shadow-lg"
            >
                <Toast.Description className="text-sm font-medium text-red-600">
                    {toastMessage}
                </Toast.Description>
            </Toast.Root>
            <Toast.Viewport className="fixed bottom-6 right-6 z-50 m-0 flex w-[360px] max-w-[calc(100vw-24px)] list-none flex-col gap-2 p-0 outline-none" />
        </Toast.Provider>
    );
}



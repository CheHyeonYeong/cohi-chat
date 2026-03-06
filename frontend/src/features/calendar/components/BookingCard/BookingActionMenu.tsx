import { useEffect, useMemo, useRef, useState } from 'react';
import { useReportHostNoShow, useReportGuestNoShow } from '../../hooks';
import type { IBookingDetail } from '../../types';
import type { AuthUser } from '~/features/member';
import NoShowReportModal from './NoShowReportModal';

type ReportType = 'host' | 'guest';

interface BookingActionMenuProps {
    booking: IBookingDetail;
    currentUser: AuthUser | undefined;
}

export default function BookingActionMenu({ booking, currentUser }: BookingActionMenuProps) {
    const [open, setOpen] = useState(false);
    const [reportType, setReportType] = useState<ReportType | null>(null);
    const [now, setNow] = useState(() => Date.now());
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 30_000);
        return () => window.clearInterval(timer);
    }, []);

    const { mutate: reportHostNoShow, isPending: isReportingHost } = useReportHostNoShow(booking.id);
    const { mutate: reportGuestNoShow, isPending: isReportingGuest } = useReportGuestNoShow(
        booking.id,
        booking.guestId,
    );

    const isGuest = !!currentUser && currentUser.id === booking.guestId;
    const isHost = !!currentUser && currentUser.id === booking.hostId;

    const isMeetingStarted = useMemo(() => {
        const [h, m] = booking.timeSlot.startTime.split(':').map(Number);
        const meetingStart = new Date(
            booking.when.getFullYear(),
            booking.when.getMonth(),
            booking.when.getDate(),
            h,
            m,
        );
        return now >= meetingStart.getTime();
    }, [booking, now]);

    const canReportHost = isGuest && booking.attendanceStatus === 'SCHEDULED' && isMeetingStarted;
    const canReportGuest = isHost && booking.attendanceStatus === 'NO_SHOW' && isMeetingStarted;

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    if (!canReportHost && !canReportGuest) return null;

    const handleReport = (reason?: string) => {
        if (reportType === 'host') {
            reportHostNoShow(reason, { onSuccess: () => setReportType(null) });
        } else if (reportType === 'guest') {
            reportGuestNoShow(reason, { onSuccess: () => setReportType(null) });
        }
    };

    return (
        <div ref={menuRef} className="relative">
            <button
                type="button"
                data-testid="booking-action-menu-trigger"
                aria-label="더보기"
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen((v) => !v);
                }}
                className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
                ···
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10">
                    {canReportHost && (
                        <button
                            type="button"
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={(e) => {
                                e.stopPropagation();
                                setReportType('host');
                                setOpen(false);
                            }}
                        >
                            호스트 노쇼 신고
                        </button>
                    )}
                    {canReportGuest && (
                        <button
                            type="button"
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={(e) => {
                                e.stopPropagation();
                                setReportType('guest');
                                setOpen(false);
                            }}
                        >
                            게스트 노쇼 신고
                        </button>
                    )}
                </div>
            )}

            {reportType && (
                <NoShowReportModal
                    title={reportType === 'host' ? '호스트 노쇼 신고' : '게스트 노쇼 신고'}
                    isPending={reportType === 'host' ? isReportingHost : isReportingGuest}
                    onSubmit={handleReport}
                    onClose={() => setReportType(null)}
                />
            )}
        </div>
    );
}

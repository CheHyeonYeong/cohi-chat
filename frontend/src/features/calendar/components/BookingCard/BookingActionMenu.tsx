import { useEffect, useRef, useState } from 'react';
import { useReportHost, useReportGuest } from '../../hooks';
import type { IBookingDetail } from '../../types';
import { useAuth } from '~/features/member';
import NoShowReportModal from './NoShowReportModal';

interface BookingActionMenuProps {
    booking: IBookingDetail;
}

export default function BookingActionMenu({ booking }: BookingActionMenuProps) {
    const [open, setOpen] = useState(false);
    const [reportTarget, setReportTarget] = useState<'host' | 'guest' | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const { mutate: reportHostMutate, isPending: isReportingHost } = useReportHost(booking.id);
    const { mutate: reportGuestMutate, isPending: isReportingGuest } = useReportGuest(
        booking.id,
        booking.guestId,
    );

    const { data: currentUser } = useAuth();
    const isPending = reportTarget === 'host' ? isReportingHost : isReportingGuest;

    const showReportHost = !!currentUser && currentUser.id !== booking.hostId;
    const showReportGuest = !!currentUser && currentUser.id !== booking.guestId;

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

    const handleReport = (nickname: string, reason: string) => {
        const combined = [nickname && `[신고 대상: ${nickname}]`, reason].filter(Boolean).join(' ');
        if (reportTarget === 'host') {
            reportHostMutate(combined || undefined, { onSuccess: () => setReportTarget(null) });
        } else {
            reportGuestMutate(combined || undefined, { onSuccess: () => setReportTarget(null) });
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
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10">
                    {showReportHost && (
                        <button
                            type="button"
                            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50"
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpen(false);
                                setReportTarget('host');
                            }}
                        >
                            {booking.host.displayName} 신고
                        </button>
                    )}
                    {showReportGuest && (
                        <button
                            type="button"
                            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50"
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpen(false);
                                setReportTarget('guest');
                            }}
                        >
                            {booking.guest.displayName} 신고
                        </button>
                    )}
                </div>
            )}

            {reportTarget && (
                <NoShowReportModal
                    isPending={isPending}
                    defaultNickname={reportTarget === 'host' ? booking.host.displayName : booking.guest.displayName}
                    onSubmit={handleReport}
                    onClose={() => setReportTarget(null)}
                />
            )}
        </div>
    );
}

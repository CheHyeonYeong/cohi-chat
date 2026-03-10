import { useState } from 'react';
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

    const { mutate: reportHostMutate, isPending: isReportingHost } = useReportHost(booking.id);
    const { mutate: reportGuestMutate, isPending: isReportingGuest } = useReportGuest(
        booking.id,
        booking.guestId,
    );

    const { data: currentUser } = useAuth();
    const isPending = reportTarget === 'host' ? isReportingHost : isReportingGuest;

    const showReportHost = !!currentUser && currentUser.id === booking.guestId;
    const showReportGuest = !!currentUser && currentUser.id === booking.hostId;
    const hasAnyAction = showReportHost || showReportGuest;

    const hostDisplayName = booking.host?.displayName?.trim() || '호스트';
    const guestDisplayName = booking.guest?.displayName?.trim() || '게스트';

    const closeMenu = () => setOpen(false);

    const handleReport = (reason: string) => {
        if (reportTarget === 'host') {
            reportHostMutate(reason, { onSuccess: () => setReportTarget(null) });
        } else {
            reportGuestMutate(reason, { onSuccess: () => setReportTarget(null) });
        }
    };

    if (!hasAnyAction) return null;

    return (
        <div className="relative">
            <button
                type="button"
                data-testid="booking-action-menu-trigger"
                aria-label="더보기"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen((v) => !v);
                }}
                className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
                ···
            </button>

            {open && (
                <>
                    <button
                        type="button"
                        aria-label="메뉴 닫기"
                        className="fixed inset-0 z-10 bg-transparent cursor-default"
                        onClick={closeMenu}
                    />
                    <div
                        role="menu"
                        className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {showReportHost && (
                            <button
                                type="button"
                                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50"
                                onClick={() => {
                                    closeMenu();
                                    setReportTarget('host');
                                }}
                            >
                                {hostDisplayName} 신고
                            </button>
                        )}
                        {showReportGuest && (
                            <button
                                type="button"
                                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50"
                                onClick={() => {
                                    closeMenu();
                                    setReportTarget('guest');
                                }}
                            >
                                {guestDisplayName} 신고
                            </button>
                        )}
                    </div>
                </>
            )}

            {reportTarget && (
                <NoShowReportModal
                    isPending={isPending}
                    onSubmit={handleReport}
                    onClose={() => setReportTarget(null)}
                />
            )}
        </div>
    );
}
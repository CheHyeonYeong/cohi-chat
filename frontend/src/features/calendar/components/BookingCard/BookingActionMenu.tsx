import { useState, useMemo } from 'react';
import { useReportHost, useReportGuest, useReportStatus } from '../../hooks';
import type { IBookingDetail } from '../../types';
import { useAuth } from '~/features/member';
import { getErrorMessage, isHttpError } from '~/libs/errorUtils';
import NoShowReportModal from './NoShowReportModal';

interface BookingActionMenuProps {
    booking: IBookingDetail;
}

type MenuView = 'closed' | 'open' | 'reporting-host' | 'reporting-guest';

export default function BookingActionMenu({ booking }: BookingActionMenuProps) {
    const [menuView, setMenuView] = useState<MenuView>('closed');
    const [locallyReported, setLocallyReported] = useState<Set<'host' | 'guest'>>(new Set());
    const [reportError, setReportError] = useState<string | null>(null);

    const { mutateAsync: reportHostMutate, isPending: isReportingHost } = useReportHost(booking.id);
    const { mutateAsync: reportGuestMutate, isPending: isReportingGuest } = useReportGuest(
        booking.id,
        booking.guestId,
    );

    const { data: currentUser } = useAuth();
    const { data: reportStatus } = useReportStatus(booking.id);

    const reportTarget = menuView === 'reporting-host' ? 'host' : menuView === 'reporting-guest' ? 'guest' : null;
    const isPending = reportTarget === 'host' ? isReportingHost : isReportingGuest;

    const reportedTargets = useMemo(() => {
        const s = new Set(locallyReported);
        if (reportStatus?.reportedHost) s.add('host');
        if (reportStatus?.reportedGuest) s.add('guest');
        return s;
    }, [reportStatus, locallyReported]);

    const showReportHost = !!currentUser && currentUser.id === booking.guestId;
    const showReportGuest = !!currentUser && currentUser.id === booking.hostId;
    const hasAnyAction = showReportHost || showReportGuest;

    const hostDisplayName = booking.host?.displayName?.trim() || '호스트';
    const guestDisplayName = booking.guest?.displayName?.trim() || '게스트';

    const handleReport = async (reason: string) => {
        const target = reportTarget!;
        setReportError(null);
        try {
            if (target === 'host') {
                await reportHostMutate(reason);
            } else {
                await reportGuestMutate(reason);
            }
            setLocallyReported((prev) => new Set([...prev, target]));
            setMenuView('closed');
        } catch (err) {
            if (isHttpError(err, 409)) {
                setLocallyReported((prev) => new Set([...prev, target]));
                setMenuView('closed');
                setReportError(null);
            } else {
                setReportError(getErrorMessage(err, '신고 처리 중 오류가 발생했습니다.'));
            }
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
                aria-expanded={menuView === 'open'}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                    e.stopPropagation();
                    setMenuView((v) => v === 'open' ? 'closed' : 'open');
                }}
                className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
                ···
            </button>

            {menuView === 'open' && (
                <>
                    <button
                        type="button"
                        aria-label="메뉴 닫기"
                        className="fixed inset-0 z-10 bg-transparent cursor-default"
                        onClick={() => setMenuView('closed')}
                    />
                    <div
                        role="menu"
                        className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {showReportHost && (
                            <button
                                type="button"
                                disabled={reportedTargets.has('host')}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => {
                                    setReportError(null);
                                    setMenuView('reporting-host');
                                }}
                            >
                                {reportedTargets.has('host') ? '신고 완료' : `${hostDisplayName} 신고`}
                            </button>
                        )}
                        {showReportGuest && (
                            <button
                                type="button"
                                disabled={reportedTargets.has('guest')}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => {
                                    setReportError(null);
                                    setMenuView('reporting-guest');
                                }}
                            >
                                {reportedTargets.has('guest') ? '신고 완료' : `${guestDisplayName} 신고`}
                            </button>
                        )}
                    </div>
                </>
            )}

            {reportTarget && (
                <NoShowReportModal
                    isPending={isPending}
                    error={reportError}
                    onSubmit={handleReport}
                    onClose={() => setMenuView('closed')}
                />
            )}
        </div>
    );
}

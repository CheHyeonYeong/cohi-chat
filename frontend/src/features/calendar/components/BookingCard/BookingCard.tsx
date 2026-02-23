import { Link } from '@tanstack/react-router';
import { cn } from '~/libs/cn';
import type { IBookingDetail } from '../../types';

interface BookingCardProps {
    booking: IBookingDetail;
    className?: string;
}

export default function BookingCard({ booking, className }: BookingCardProps) {
    const when = new Date(booking.when);

    return (
        <Link to="/booking/$id" params={{ id: booking.id }}>
            <div
                className={cn(
                    'bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer',
                    className,
                )}
            >
                {/* Host info */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--cohe-bg-warm)] flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-[var(--cohe-primary)]">
                            {booking.host.displayName[0] ?? '?'}
                        </span>
                    </div>
                    <p className="font-semibold text-[var(--cohe-text-dark)]">{booking.host.displayName}님과</p>
                </div>

                {/* Topic */}
                <p className="text-base font-medium text-gray-800 mb-3 line-clamp-2">{booking.topic}</p>

                {/* Date / Time */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
                    <span>
                        {when.toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                        {booking.timeSlot.startTime} - {booking.timeSlot.endTime}
                    </span>
                </div>

                {/* File count badge */}
                {booking.files.length > 0 && (
                    <div className="mt-3 inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 rounded-full px-2.5 py-0.5 border border-gray-100">
                        <span>첨부</span>
                        <span>{booking.files.length}개</span>
                    </div>
                )}
            </div>
        </Link>
    );
}

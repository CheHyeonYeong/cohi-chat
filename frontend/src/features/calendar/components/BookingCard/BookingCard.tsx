import { cn } from '~/libs/cn';
import { Card } from '~/components/card';
import type { IBookingDetail } from '../../types';

interface BookingCardProps {
    booking: IBookingDetail;
    onSelect?: (id: number) => void;
    isSelected?: boolean;
    className?: string;
}

export default function BookingCard({ booking, onSelect, isSelected = false, className }: BookingCardProps) {
    const { startedAt } = booking;

    return (
        <Card
            asChild
            size="sm"
            className={cn(
                'border transition-all cursor-pointer hover:shadow-md',
                isSelected
                    ? 'border-[var(--cohi-primary)] shadow-md'
                    : 'border-gray-100',
                className,
            )}
        >
            <button
                type="button"
                onClick={() => onSelect?.(booking.id)}
            >
                {/* Host info */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--cohi-bg-warm)] flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-[var(--cohi-primary)]">
                            {booking.host?.displayName?.[0] ?? '?'}
                        </span>
                    </div>
                    <p className="font-semibold text-[var(--cohi-text-dark)]">{booking.host.displayName}님과</p>
                </div>

                {/* Topic */}
                <p className="text-base font-medium text-gray-800 mb-3 line-clamp-2">{booking.topic}</p>

                {/* Date / Time */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
                    <span>
                        {startedAt.toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                        {booking.timeSlot.startedAt} - {booking.timeSlot.endedAt}
                    </span>
                </div>

                {/* File count badge */}
                {booking.files.length > 0 && (
                    <div className="mt-3 inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 rounded-full px-2.5 py-0.5 border border-gray-100">
                        <span>첨부</span>
                        <span>{booking.files.length}개</span>
                    </div>
                )}
            </button>
        </Card>
    );
}

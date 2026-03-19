import { cn } from '~/libs/cn';
import { Card } from '~/components/card';
import { Tag } from '~/components/Tag';
import type { IBookingDetail, BookingRole } from '../../types';
import type { IUserSimple } from '~/types/user';

interface BookingCardProps {
    booking: IBookingDetail;
    onSelect?: (id: number) => void;
    isSelected?: boolean;
    className?: string;
    role?: BookingRole;
    counterpart?: Pick<IUserSimple, 'username' | 'displayName'>;
}

export function BookingCard({ booking, onSelect, isSelected = false, className, role, counterpart }: BookingCardProps) {
    const { startedAt } = booking;
    const fallback = role === 'host' ? booking.guest : booking.host;
    const displayName = (counterpart?.displayName || counterpart?.username) || (fallback.displayName || fallback.username) || '상대방';
    const avatarInitial = displayName[0] ?? '?';

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
                className="w-full"
                onClick={() => onSelect?.(booking.id)}
            >
                {/* Role tag + Host/Counterpart info */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--cohi-bg-warm)] flex items-center justify-center flex-shrink-0">
                        <span data-testid="booking-avatar-initial" className="text-sm font-semibold text-[var(--cohi-primary)]">
                            {avatarInitial}
                        </span>
                    </div>
                    <p className="font-semibold text-[var(--cohi-text-dark)] flex-1 text-left truncate">{displayName}님과의 커피챗</p>
                    {role && (
                        <span data-testid="booking-role-tag">
                            <Tag
                                color={role === 'guest' ? 'guest' : 'host'}
                                size="sm"
                                title={role === 'guest'
                                    ? `내가 ${displayName}님에게 커피챗을 신청했습니다`
                                    : `${displayName}님이 나에게 커피챗을 신청했습니다`}
                            >
                                {role === 'guest' ? '게스트' : '호스트'}
                            </Tag>
                        </span>
                    )}
                </div>

                {/* Topic */}
                <div className="flex flex-wrap gap-2 mb-3">
                    {booking.topic.split(',').map((t) => (
                        <Tag key={t.trim()} size="sm">{t.trim()}</Tag>
                    ))}
                </div>

                {/* Description */}
                {booking.description && (
                    <p className="text-sm text-gray-500 text-left truncate mb-3">{booking.description}</p>
                )}

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
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                        {booking.meetingType === 'ONLINE' ? (
                            <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                온라인
                            </>
                        ) : (
                            <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                오프라인
                            </>
                        )}
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

import dayjs from 'dayjs';
import type { IBookingDetail } from '../../types';
import { DAY_NAMES, type Weekday } from '~/libs/constants/days';
import { formatKoreanDate } from '~/libs/date';

interface BookingMetaSectionProps {
    booking: IBookingDetail;
}

export const BookingMetaSection = ({ booking }: BookingMetaSectionProps) => {
    const { startedAt } = booking;

    const dateText = formatKoreanDate(startedAt);
    const dayLabel = ` (${DAY_NAMES[dayjs(startedAt).day() as Weekday]})`;

    return (
        <>
            <section className="space-y-3">
                <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Topic</span>
                    <p className="text-sm font-semibold text-cohi-text-dark mt-0.5">{booking.topic}</p>
                </div>
                <div className="flex gap-6">
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</span>
                        <p className="text-sm text-gray-600 mt-0.5">{dateText}{dayLabel}</p>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time</span>
                        <p className="text-sm text-gray-600 mt-0.5">{booking.timeSlot.startedAt} - {booking.timeSlot.endedAt}</p>
                    </div>
                </div>
                <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Meeting Type</span>
                    <div className="flex items-center gap-2 mt-0.5">
                        {booking.meetingType === 'ONLINE' ? (
                            <>
                                <svg className="w-4 h-4 text-cohi-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm text-gray-600">온라인</span>
                                {booking.meetingLink && (
                                    <a
                                        href={booking.meetingLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-cohi-primary hover:underline ml-1"
                                    >
                                        링크 열기
                                    </a>
                                )}
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 text-cohi-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-sm text-gray-600">오프라인</span>
                                {booking.location && (
                                    <span className="text-xs text-gray-500 ml-1">- {booking.location}</span>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </section>
            <section className="mt-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">설명</span>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed whitespace-pre-wrap">{booking.description}</p>
            </section>
        </>
    );
};

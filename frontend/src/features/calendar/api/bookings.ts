import { httpClient } from '~/libs/httpClient';
import type { StringTime, ISO8601String } from '~/types/base';
import type { AttendanceStatus, IBooking, IBookingDetail, INoShowHistoryItem, IPaginatedBookingDetail } from '../types';
import { API_URL } from './constants';

export async function getBookingsByDate(slug: string, date: { year: number; month: number }): Promise<IBooking[]> {
    const url = `${API_URL}/calendar/${slug}/bookings?year=${date.year}&month=${date.month}`;
    const data: IBooking[] = await httpClient<IBooking[]>(url);
    return data;
}

interface BookingFlatResponse {
    id: number;
    timeSlotId: number;
    guestId: string;
    hostId: string | null;
    when: string;
    startTime: StringTime;
    endTime: StringTime;
    topic: string;
    description: string;
    attendanceStatus: string;
    createdAt: ISO8601String;
    hostUsername: string | null;
    hostDisplayName: string | null;
}

/** 날짜 전용 문자열("YYYY-MM-DD")을 로컬 자정으로 파싱. UTC 기반 파싱으로 인한 날짜 오차 방지. */
function parseDateLocal(dateStr: string): Date {
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
}

function toBookingDetail(b: BookingFlatResponse): IBookingDetail {
    return {
        id: b.id,
        when: parseDateLocal(b.when),
        topic: b.topic,
        description: b.description,
        timeSlot: {
            id: b.timeSlotId,
            userId: '',
            startTime: b.startTime,
            endTime: b.endTime,
            weekdays: [],
            startDate: null,
            endDate: null,
            createdAt: b.createdAt,
            updatedAt: b.createdAt,
        },
        host: {
            username: b.hostUsername ?? '',
            displayName: b.hostDisplayName ?? '',
        },
        files: [],
        createdAt: b.createdAt,
        updatedAt: b.createdAt,
        attendanceStatus: b.attendanceStatus as AttendanceStatus,
        hostId: b.hostId,
        guestId: b.guestId,
    };
}

export async function getMyBookings({ page = 1, pageSize = 10 }: { page?: number; pageSize?: number }): Promise<IPaginatedBookingDetail> {
    const list = await httpClient<BookingFlatResponse[]>(`${API_URL}/bookings/guest/me`) ?? [];
    const bookings = list.map(toBookingDetail);

    const start = (page - 1) * pageSize;
    return {
        bookings: bookings.slice(start, start + pageSize),
        totalCount: bookings.length,
    };
}

export async function getBooking(id: number): Promise<IBookingDetail> {
    const b = await httpClient<BookingFlatResponse>(`${API_URL}/bookings/${id}`);
    return toBookingDetail(b);
}

export async function uploadBookingFile(id: number, files: FormData): Promise<IBookingDetail> {
    const url = `${API_URL}/bookings/${id}/upload`;
    const data: IBookingDetail = await httpClient<IBookingDetail>(url, {
        method: 'POST',
        body: files,
    });
    return data;
}

export async function reportHostNoShow(bookingId: number, reason?: string): Promise<IBookingDetail> {
    const b = await httpClient<BookingFlatResponse>(`${API_URL}/bookings/${bookingId}/report-noshow`, {
        method: 'POST',
        body: reason && reason.trim() !== '' ? { reason } : undefined,
    });
    return toBookingDetail(b);
}

export async function getNoShowHistory(hostId: string): Promise<INoShowHistoryItem[]> {
    return await httpClient<INoShowHistoryItem[]>(`${API_URL}/bookings/host/${hostId}/noshow-history`);
}

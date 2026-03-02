import { httpClient } from '~/libs/httpClient';
import type { StringTime, ISO8601String } from '~/types/base';
import type { AttendanceStatus, IBooking, IBookingDetail, IBookingFile, INoShowHistoryItem, IPaginatedBookingDetail } from '../types';
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

/** ?? ?? ???("YYYY-MM-DD")? ?? ???? ??. UTC ?? ???? ?? ?? ?? ??. */
function parseDateLocal(dateStr: string): Date {
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
}

function toBookingDetail(b: BookingFlatResponse, files: IBookingFile[] = []): IBookingDetail {
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
        files,
        createdAt: b.createdAt,
        updatedAt: b.createdAt,
        attendanceStatus: b.attendanceStatus as AttendanceStatus,
        hostId: b.hostId,
        guestId: b.guestId,
    };
}

export async function getMyBookings({ page = 1, pageSize = 10 }: { page?: number; pageSize?: number }): Promise<IPaginatedBookingDetail> {
    const list = await httpClient<BookingFlatResponse[]>(`${API_URL}/bookings/guest/me`) ?? [];
    const bookings = list.map(b => toBookingDetail(b));

    const start = (page - 1) * pageSize;
    return {
        bookings: bookings.slice(start, start + pageSize),
        totalCount: bookings.length,
    };
}

export async function getBooking(id: number): Promise<IBookingDetail> {
    const [b, files] = await Promise.all([
        httpClient<BookingFlatResponse>(`${API_URL}/bookings/${id}`),
        httpClient<IBookingFile[]>(`${API_URL}/bookings/${id}/files`)
    ]);
    return toBookingDetail(b, files);
}

export async function uploadBookingFile(id: number, files: FormData): Promise<IBookingFile> {
    const url = `${API_URL}/bookings/${id}/files`;
    const data: IBookingFile = await httpClient<IBookingFile>(url, {
        method: 'POST',
        body: files,
    });
    return data;
}

export async function reportHostNoShow(bookingId: number, reason?: string): Promise<IBookingDetail> {
    const [b, files] = await Promise.all([
        httpClient<BookingFlatResponse>(`${API_URL}/bookings/${bookingId}/report-noshow`, {
            method: 'POST',
            body: reason && reason.trim() !== '' ? { reason } : undefined,
        }),
        httpClient<IBookingFile[]>(`${API_URL}/bookings/${bookingId}/files`)
    ]);
    return toBookingDetail(b, files);
}

export async function getNoShowHistory(hostId: string): Promise<INoShowHistoryItem[]> {
    return await httpClient<INoShowHistoryItem[]>(`${API_URL}/bookings/host/${hostId}/noshow-history`);
}

export async function getBookingFiles(id: number): Promise<IBookingFile[]> {
    return await httpClient<IBookingFile[]>(`${API_URL}/bookings/${id}/files`);
}

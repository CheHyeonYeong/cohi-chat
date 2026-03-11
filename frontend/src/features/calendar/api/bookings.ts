import { httpClient } from '~/libs/httpClient';
import type { AttendanceStatus, IBooking, IBookingDetail, IBookingFile, IGuestNoShowHistoryItem, INoShowHistoryItem, IPaginatedBookingDetail } from '../types';
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
    startedAt: string;
    endedAt: string;
    topic: string;
    description: string;
    attendanceStatus: string;
    createdAt: string;
    hostUsername: string | null;
    hostDisplayName: string | null;
    guestUsername: string | null;
    guestDisplayName: string | null;
}

/** ISO 8601 datetime 문자열을 로컬 Date 객체로 파싱. */
function parseDateTime(dateTimeStr: string): Date {
    return new Date(dateTimeStr);
}

/** ISO 8601 datetime 문자열에서 "HH:mm" 형식의 시간 문자열 추출. */
function extractTime(dateTimeStr: string): string {
    const date = new Date(dateTimeStr);
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function toBookingDetail(b: BookingFlatResponse, files: IBookingFile[] = []): IBookingDetail {
    return {
        id: b.id,
        startedAt: parseDateTime(b.startedAt),
        endedAt: parseDateTime(b.endedAt),
        topic: b.topic,
        description: b.description,
        timeSlot: {
            id: b.timeSlotId,
            userId: '',
            startedAt: extractTime(b.startedAt),
            endedAt: extractTime(b.endedAt),
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
        guest: {
            username: b.guestUsername ?? '',
            displayName: b.guestDisplayName ?? '',
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

export async function getMyHostBookings({ page = 1, pageSize = 10 }: { page?: number; pageSize?: number }): Promise<IPaginatedBookingDetail> {
    const list = await httpClient<BookingFlatResponse[]>(`${API_URL}/bookings/host/me`) ?? [];
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

export async function reportHost(bookingId: number, reason?: string): Promise<IBookingDetail> {
    const b = await httpClient<BookingFlatResponse>(`${API_URL}/bookings/${bookingId}/report-noshow`, {
        method: 'POST',
        body: { reason: reason?.trim() || null },
    });
    const files = await httpClient<IBookingFile[]>(`${API_URL}/bookings/${bookingId}/files`);
    return toBookingDetail(b, files);
}

export async function getNoShowHistory(hostId: string): Promise<INoShowHistoryItem[]> {
    return await httpClient<INoShowHistoryItem[]>(`${API_URL}/bookings/host/${hostId}/noshow-history`);
}

export async function getBookingFiles(id: number): Promise<IBookingFile[]> {
    return await httpClient<IBookingFile[]>(`${API_URL}/bookings/${id}/files`);
}

export async function reportGuest(bookingId: number, reason?: string): Promise<IGuestNoShowHistoryItem> {
    return await httpClient<IGuestNoShowHistoryItem>(`${API_URL}/bookings/${bookingId}/report-guest-noshow`, {
        method: 'POST',
        body: { reason: reason?.trim() || null },
    });
}

export async function getGuestNoShowHistory(guestId: string): Promise<IGuestNoShowHistoryItem[]> {
    return await httpClient<IGuestNoShowHistoryItem[]>(`${API_URL}/bookings/guest/${guestId}/noshow-history`);
}

export interface IReportStatus {
    reportedHost: boolean;
    reportedGuest: boolean;
}

export async function getReportStatus(bookingId: number): Promise<IReportStatus> {
    return await httpClient<IReportStatus>(`${API_URL}/bookings/${bookingId}/report-status`);
}

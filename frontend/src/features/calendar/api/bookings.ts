import { httpClient } from '~/libs/httpClient';
import type { IBooking, IBookingDetail, IPaginatedBookingDetail } from '../types';
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
    when: string;
    startTime: string;
    endTime: string;
    topic: string;
    description: string;
    attendanceStatus: string;
    createdAt: string;
}

export async function getMyBookings({ page = 1, pageSize = 10 }: { page?: number; pageSize?: number }): Promise<IPaginatedBookingDetail> {
    const list = await httpClient<BookingFlatResponse[]>(`${API_URL}/bookings/guest/me`) ?? [];

    const bookings: IBookingDetail[] = list.map((b) => ({
        id: b.id,
        when: new Date(b.when),
        topic: b.topic,
        description: b.description,
        timeSlot: {
            id: b.timeSlotId,
            userId: '',
            startTime: b.startTime,
            endTime: b.endTime,
            weekdays: [],
            createdAt: b.createdAt,
            updatedAt: b.createdAt,
        },
        host: { username: '', displayName: '' },
        files: [],
        createdAt: b.createdAt,
        updatedAt: b.createdAt,
    }));

    const start = (page - 1) * pageSize;
    return {
        bookings: bookings.slice(start, start + pageSize),
        totalCount: bookings.length,
    };
}

export async function getBooking(id: number): Promise<IBookingDetail> {
    const url = `${API_URL}/bookings/${id}`;
    const data: IBookingDetail = await httpClient<IBookingDetail>(url);
    return data;
}

export async function uploadBookingFile(id: number, files: FormData): Promise<IBookingDetail> {
    const url = `${API_URL}/bookings/${id}/upload`;
    const data: IBookingDetail = await httpClient<IBookingDetail>(url, {
        method: 'POST',
        body: files,
    });
    return data;
}

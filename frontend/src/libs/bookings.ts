import { httpClient } from '~/libs/httpClient';
import { IBookingResponse, IBookingDetail, IPaginatedBookingDetail } from '~/types/booking';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export async function getMyBookingsAsGuest(): Promise<IBookingResponse[]> {
    const url = `${API_URL}/bookings/guest/me`;
    const data: IBookingResponse[] = await httpClient<IBookingResponse[]>(url);
    return data;
}

export async function getBooking(id: number): Promise<IBookingResponse> {
    const url = `${API_URL}/bookings/${id}`;
    const data: IBookingResponse = await httpClient<IBookingResponse>(url);
    return data;
}

export async function uploadBookingFile(id: number, file: FormData): Promise<unknown> {
    const url = `${API_URL}/bookings/${id}/files`;
    const data = await httpClient<unknown>(url, {
        method: 'POST',
        body: file,
    });
    return data;
}
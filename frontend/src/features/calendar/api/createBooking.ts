import { httpClient } from '~/libs/httpClient';
import type { IBookingDetail, IBookingPayload } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export async function createBooking(slug: string, bookingData: IBookingPayload): Promise<IBookingDetail> {
    const response = await httpClient<IBookingDetail>(`${API_URL}/bookings/${slug}`, {
        method: 'POST',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body: bookingData as any,
    });

    if (!response) {
        throw new Error('Booking creation failed');
    }

    return response;
}

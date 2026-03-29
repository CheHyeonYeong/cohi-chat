import { httpClient } from '~/libs/httpClient';
import type { IBookingDetail, IBookingPayload } from '../types';
import { API_URL } from './constants';

export const createBooking = async (username: string, bookingData: IBookingPayload): Promise<IBookingDetail> => {
    const response = await httpClient<IBookingDetail>(`${API_URL}/bookings`, {
        method: 'POST',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body: bookingData as any,
    });

    if (!response) {
        throw new Error('Booking creation failed');
    }

    return response;
};

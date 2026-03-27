import { httpClient } from '~/libs/httpClient';
import type { IBookingDetail, IBookingUpdatePayload } from '../types';
import { API_URL } from './constants';

export const updateBooking = async (bookingId: number, data: IBookingUpdatePayload): Promise<IBookingDetail> => {
    const response = await httpClient<IBookingDetail>(`${API_URL}/bookings/${bookingId}`, {
        method: 'PATCH',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body: data as any,
    });

    if (!response) {
        throw new Error('Booking update failed');
    }

    return response;
};

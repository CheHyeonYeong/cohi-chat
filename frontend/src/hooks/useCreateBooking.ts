import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { httpClient } from '~/libs/httpClient';
import { IBookingResponse, IBookingPayload } from '~/types/booking';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export function useCreateBooking(slug: string, year: number, month: number): UseMutationResult<IBookingResponse, Error, IBookingPayload> {
    const navigate = useNavigate();

    return useMutation<IBookingResponse, Error, IBookingPayload>({
        mutationFn: async (bookingData: IBookingPayload): Promise<IBookingResponse> => {
            const response = await httpClient<IBookingResponse>(`${API_URL}/bookings`, {
                method: 'POST',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                body: bookingData as any,
            });

            if (!response) {
                throw new Error('Booking creation failed');
            }

            return response;
        },
        onSuccess: () => {
            navigate({
                to: '/app/calendar/$slug',
                params: { slug },
                search: { year, month },
            });
        },
        onError: (error: Error) => {
            console.error('Error creating booking:', error.message);
        },
    });
} 
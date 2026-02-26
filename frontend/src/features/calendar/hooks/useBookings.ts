import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { snakeToCamel } from '~/libs/utils';
import { API_URL, getBooking, getBookingsByDate, getMyBookings, uploadBookingFile } from '../api';
import type { IBooking, IBookingDetail, ICalendarEvent, IPaginatedBookingDetail } from '../types';
import { calendarKeys } from './queryKeys';

export function useBookings(hostname: string, date: Date | null) {
    return useQuery<IBooking[]>({
        queryKey: date ? calendarKeys.bookings(date.getFullYear(), date.getMonth() + 1) : ['bookings'],
        queryFn: () => getBookingsByDate(hostname, { year: date!.getFullYear(), month: date!.getMonth() + 1 }),
        enabled: !!date,
    });
}

export function useMyBookings({ page, pageSize }: { page?: number; pageSize?: number }) {
    return useQuery<IPaginatedBookingDetail>({
        queryKey: calendarKeys.myBookings(page, pageSize),
        queryFn: () => getMyBookings({ page, pageSize }),
    });
}

export function useBooking(id: number | null) {
    return useQuery<IBookingDetail>({
        queryKey: calendarKeys.booking(id ?? 0),
        queryFn: () => getBooking(id!),
        enabled: id !== null,
    });
}

export function useUploadBookingFile(id: number) {
    return useMutation<IBookingDetail, Error, FormData>({
        mutationFn: (files: FormData) => uploadBookingFile(id, files),
    });
}

export function useBookingsStreamQuery({
    slug,
    year,
    month,
    onMessage,
}: {
    slug: string;
    year: number;
    month: number;
    onMessage?: (data: IBooking | ICalendarEvent) => void;
}) {
    const [items, setItems] = useState<Array<IBooking | ICalendarEvent>>([]);
    const onMessageRef = useRef(onMessage);

    useEffect(() => {
        onMessageRef.current = onMessage;
    });

    useEffect(() => {
        setItems([]);
        let isCancelled = false;
        const endpoint = `${API_URL}/calendar/${slug}/bookings/stream?year=${year}&month=${month}`;

        const fetchStream = async () => {
            try {
                const response = await fetch(endpoint);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const reader = response.body!.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    if (isCancelled) break;

                    const { done, value } = await reader.read();
                    if (done) {
                        await reader.cancel();
                        break;
                    }

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n').filter(Boolean);
                    lines.forEach(line => {
                        const data = snakeToCamel(JSON.parse(line)) as IBooking | ICalendarEvent;
                        setItems((prevData) => {
                            const index = prevData.findIndex((item) => item.id === data.id);
                            if (index === -1) {
                                return [...prevData, data];
                            }
                            return prevData;
                        });
                        onMessageRef.current?.(data);
                    });
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error('Error fetching stream:', error);
                }
            }
        };

        fetchStream();

        return () => {
            isCancelled = true;
        };
    }, [slug, year, month]);

    return items;
}

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { snakeToCamel } from '~/libs/utils';
import type { IBooking, ICalendarEvent } from '~/components/calendar';

export function useBookingsSSEQuery({
    endpoint,
    onMessage,
}: {
    endpoint: string;
    onMessage?: (data: IBooking | ICalendarEvent) => void;
}) {
    const [data, setData] = useState<Array<IBooking | ICalendarEvent>>([]);
    const [connectionError, setConnectionError] = useState<Event | null>(null);
    const onMessageRef = useRef(onMessage);

    useLayoutEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
        const eventSource = new EventSource(endpoint, {
            withCredentials: true,
        });

        eventSource.onopen = () => {
            setConnectionError(null);
        };

        eventSource.onmessage = (event) => {
            try {
                const newData = snakeToCamel(JSON.parse(event.data)) as IBooking | ICalendarEvent;
                if ((newData as unknown as { type: string }).type === 'complete') {
                    eventSource.close();
                    return;
                }
                setData((prevData) => {
                    const index = prevData.findIndex((item) => item.id === newData.id);
                    if (index === -1) {
                        return [...prevData, newData];
                    }
                    return prevData;
                });
                onMessageRef.current?.(newData);
            } catch (error) {
                console.error('SSE message parsing error:', error);
            }
        };

        eventSource.onerror = (error) => {
            setConnectionError(error);
            console.error('SSE connection error:', error);
        };

        return () => eventSource.close();
    }, [endpoint]);

    return { data, connectionError };
}

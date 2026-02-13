import { httpClient } from '~/libs/httpClient';
import type { CalendarCreatePayload, CalendarUpdatePayload, CalendarResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const CALENDAR_API = `${API_BASE}/calendar/v1`;

export async function createCalendar(payload: CalendarCreatePayload): Promise<CalendarResponse> {
    return httpClient<CalendarResponse>(CALENDAR_API, {
        method: 'POST',
        body: payload,
    });
}

export async function getMyCalendar(): Promise<CalendarResponse> {
    return httpClient<CalendarResponse>(CALENDAR_API);
}

export async function updateCalendar(payload: CalendarUpdatePayload): Promise<CalendarResponse> {
    return httpClient<CalendarResponse>(CALENDAR_API, {
        method: 'PUT',
        body: payload,
    });
}

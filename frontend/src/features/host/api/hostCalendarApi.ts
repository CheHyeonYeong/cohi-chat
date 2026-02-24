import { httpClient } from '~/libs/httpClient';
import type { CalendarCreatePayload, CalendarUpdatePayload, CalendarResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const CALENDAR_API = `${API_BASE}/calendar/v1`;

export async function createCalendar(payload: CalendarCreatePayload): Promise<CalendarResponse> {
    const response = await httpClient<CalendarResponse>(CALENDAR_API, {
        method: 'POST',
        body: payload,
    });
    if (!response) {
        throw new Error('캘린더 생성에 실패했습니다.');
    }
    return response;
}

export async function getMyCalendar(): Promise<CalendarResponse> {
    return httpClient<CalendarResponse>(CALENDAR_API);
}

export async function updateCalendar(payload: CalendarUpdatePayload): Promise<CalendarResponse> {
    const response = await httpClient<CalendarResponse>(CALENDAR_API, {
        method: 'PUT',
        body: payload,
    });
    if (!response) {
        throw new Error('캘린더 수정에 실패했습니다.');
    }
    return response;
}

export async function getServiceAccountEmail(): Promise<{ serviceAccountEmail: string }> {
    const res = await fetch(`${API_BASE}/calendar/v1/service-account`);
    if (!res.ok) throw new Error('Failed to fetch service account email');
    return res.json();
}

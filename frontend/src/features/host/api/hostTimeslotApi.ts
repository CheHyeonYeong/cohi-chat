import { httpClient } from '~/libs/httpClient';
import type { TimeSlotCreatePayload, TimeSlotResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const TIMESLOT_API = `${API_BASE}/timeslot/v1`;

export async function createTimeslot(payload: TimeSlotCreatePayload): Promise<TimeSlotResponse> {
    return httpClient<TimeSlotResponse>(TIMESLOT_API, {
        method: 'POST',
        body: payload,
    });
}

export async function getMyTimeslots(): Promise<TimeSlotResponse[]> {
    return (await httpClient<TimeSlotResponse[]>(TIMESLOT_API)) ?? [];
}

export async function deleteTimeslot(id: number): Promise<void> {
    await httpClient<void>(`${TIMESLOT_API}/${id}`, { method: 'DELETE' });
}

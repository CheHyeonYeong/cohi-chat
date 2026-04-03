import { httpClient } from '~/libs/httpClient';
import type { TimeSlotCreatePayload, TimeSlotResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const TIMESLOT_API = `${API_BASE}/timeslot/v1`;

export const createTimeslot = async (payload: TimeSlotCreatePayload): Promise<TimeSlotResponse> => {
    const response = await httpClient<TimeSlotResponse>(TIMESLOT_API, {
        method: 'POST',
        body: payload,
    });
    if (!response) {
        throw new Error('타임슬롯 생성에 실패했습니다.');
    }
    return response;
};

export const getMyTimeslots = async (): Promise<TimeSlotResponse[]> => (await httpClient<TimeSlotResponse[]>(TIMESLOT_API)) ?? [];

export const updateTimeslot = async (id: number, payload: TimeSlotCreatePayload): Promise<TimeSlotResponse> => {
    const response = await httpClient<TimeSlotResponse>(`${TIMESLOT_API}/${id}`, {
        method: 'PATCH',
        body: payload,
    });
    if (!response) {
        throw new Error('??꾩뒳濡??섏젙???ㅽ뙣?덉뒿?덈떎.');
    }
    return response;
};

export const deleteTimeslot = async (id: number): Promise<void> => {
    await httpClient<void>(`${TIMESLOT_API}/${id}`, { method: 'DELETE' });
};

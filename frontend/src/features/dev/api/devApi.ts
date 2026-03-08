import { httpClient } from '~/libs/httpClient';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const DEV_API = `${API_BASE}/dev`;

export interface DummyDataRequest {
    memberCount: number;
    hostCount: number;
    timeSlotCount: number;
    bookingCount: number;
}

export interface DummyDataResponse {
    membersCreated: number;
    hostsCreated: number;
    timeSlotsCreated: number;
    bookingsCreated: number;
}

export async function generateDummyDataApi(
    request: DummyDataRequest
): Promise<DummyDataResponse> {
    return httpClient<DummyDataResponse>(`${DEV_API}/dummy-data/generate`, {
        method: 'POST',
        body: request,
    });
}

export async function clearDummyDataApi(): Promise<void> {
    return httpClient<void>(`${DEV_API}/dummy-data/clear`, {
        method: 'DELETE',
    });
}

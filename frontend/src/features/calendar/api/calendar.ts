import { httpClient } from '~/libs/httpClient';
import type { ICalendar, ITimeSlot } from '../types';
import { API_URL } from './constants';

export async function getCalendarEvent(slug: string): Promise<ICalendar> {
    const url = `${API_URL}/calendar/${slug}`;
    const data: ICalendar = await httpClient(url);
    return data;
}

export async function getTimeslots(slug: string, date: Date): Promise<ITimeSlot[]> {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const url = `${API_URL}/time-slots/${slug}?year=${year}&month=${month}`;
    const data: ITimeSlot[] = await httpClient(url);
    return data;
}

export async function getTimeslotsByHostId(hostId: string): Promise<ITimeSlot[]> {
    const url = `${API_URL}/timeslot/v1/hosts/${hostId}`;
    const data: ITimeSlot[] = await httpClient(url);
    return data;
}

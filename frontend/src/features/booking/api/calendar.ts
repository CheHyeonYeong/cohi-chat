import { httpClient } from '~/libs/httpClient';
import type { IBooking, ICalendar, ITimeSlot } from '~/components/calendar';
import { API_URL } from './constants';

export const getCalendarEvent = async (slug: string): Promise<ICalendar> => {
    const url = `${API_URL}/calendar/${slug}`;
    const data: ICalendar = await httpClient(url);
    return data;
};

export const getTimeslots = async (slug: string, date: Date): Promise<ITimeSlot[]> => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const url = `${API_URL}/time-slots/${slug}?year=${year}&month=${month}`;
    const data: ITimeSlot[] = await httpClient(url);
    return data;
};

export const getTimeslotsByHostId = async (hostId: string): Promise<ITimeSlot[]> => {
    const url = `${API_URL}/timeslot/v1/hosts/${hostId}`;
    const data: ITimeSlot[] = await httpClient(url);
    return data;
};

export const getBookingsByDate = async (slug: string, date: { year: number; month: number }): Promise<IBooking[]> => {
    const url = `${API_URL}/calendar/${slug}/bookings?year=${date.year}&month=${date.month}`;
    const data: IBooking[] = await httpClient<IBooking[]>(url);
    return data;
};

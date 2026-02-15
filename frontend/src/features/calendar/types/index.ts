import type { DateString, ISO8601String, StringTime } from '~/types/base';
import type { IUserSimple } from '~/types/user';

export interface ITimeSlot {
    id: number;
    userId: string;
    startTime: StringTime;
    endTime: StringTime;
    weekdays: number[];
    startDate: string | null;
    endDate: string | null;
    createdAt: ISO8601String;
    updatedAt: ISO8601String;
}

export interface IBooking {
    id: number;
    when: DateString;
    timeSlot: ITimeSlot;
}

export interface ICalendarEvent {
    id: string;
    when: DateString;
    timeSlot: ITimeSlot;
}

export interface IBookingDetail {
    id: number;
    when: Date;
    topic: string;
    description: string;
    timeSlot: ITimeSlot;
    host: Pick<IUserSimple, 'username' | 'displayName'>;
    files: IBookingFile[];
    createdAt: ISO8601String;
    updatedAt: ISO8601String;
}

export interface IBookingPayload {
    when: DateString;
    topic: string;
    description: string;
    timeSlotId: number;
}

export interface IPaginatedBookingDetail {
    bookings: IBookingDetail[];
    totalCount: number;
}

export interface IBookingFile {
    id: number;
    file: string;
    originalFileName: string;
    fileSize: number;
    contentType: string;
}

export interface ICalendar {
    topics: string[];
    description: string;
}

export interface ICalendarDetail {
    topics: string[];
    description: string;
    hostId: number;
    googleCalendarId: string;
    createdAt: string;
    updatedAt: string;
}

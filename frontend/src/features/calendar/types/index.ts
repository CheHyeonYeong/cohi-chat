import type { ISO8601String, ISO8601DateTimeString, StringTime } from '~/types/base';
import type { IUserSimple } from '~/types/user';

export type AttendanceStatus =
    | 'SCHEDULED'
    | 'ATTENDED'
    | 'NO_SHOW'
    | 'HOST_NO_SHOW'
    | 'CANCELLED'
    | 'SAME_DAY_CANCEL'
    | 'LATE';

export interface ITimeSlot {
    id: number;
    userId: string;
    startedAt: StringTime;
    endedAt: StringTime;
    weekdays: number[];
    startDate: string | null;
    endDate: string | null;
    createdAt: ISO8601String;
    updatedAt: ISO8601String;
}

export interface IBooking {
    id: number;
    startedAt: ISO8601DateTimeString;
    endedAt: ISO8601DateTimeString;
}

export interface ICalendarEvent {
    id: string;
    startedAt: ISO8601DateTimeString;
    endedAt: ISO8601DateTimeString;
}

export interface IBookingDetail {
    id: number;
    startedAt: Date;
    endedAt: Date;
    topic: string;
    description: string;
    timeSlot: ITimeSlot;
    host: Pick<IUserSimple, 'username' | 'displayName'>;
    files: IBookingFile[];
    createdAt: ISO8601String;
    updatedAt: ISO8601String;
    attendanceStatus: AttendanceStatus;
    hostId: string | null;
    guestId: string;
}

export interface INoShowHistoryItem {
    id: number;
    bookingId: number;
    hostId: string;
    reportedBy: string;
    reason: string | null;
    reportedAt: string;
    bookingStartedAt: string;
    bookingEndedAt: string;
    bookingTopic: string;
}

export interface IBookingPayload {
    when: string;
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
    fileName: string;
    originalFileName: string;
    fileSize: number;
    contentType: string;
    createdAt: ISO8601String;
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

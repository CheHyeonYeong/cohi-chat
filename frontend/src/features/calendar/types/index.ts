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
    startedAt: string;
    endedAt: string;
    weekdays: number[];
    startDate: string | null;
    endDate: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface IBooking {
    id: number;
    startedAt: string;
    endedAt: string;
}

export interface ICalendarEvent {
    id: string;
    startedAt: string;
    endedAt: string;
}

export interface IBookingDetail {
    id: number;
    startedAt: Date;
    endedAt: Date;
    topic: string;
    description: string;
    timeSlot: ITimeSlot;
    host: Pick<IUserSimple, 'username' | 'displayName'>;
    guest: Pick<IUserSimple, 'username' | 'displayName'>;
    files: IBookingFile[];
    createdAt: string;
    updatedAt: string;
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


export interface IGuestNoShowHistoryItem {
    id: number;
    bookingId: number;
    guestId: string;
    reportedBy: string;
    reason: string | null;
    reportedAt: string;
    bookingDate: string;
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
    createdAt: string;
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

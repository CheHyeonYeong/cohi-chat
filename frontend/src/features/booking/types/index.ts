import type { IUserSimple } from '~/types/user';
import type { ITimeSlot } from '~/components/calendar';

export type AttendanceStatus =
    | 'SCHEDULED'
    | 'ATTENDED'
    | 'NO_SHOW'
    | 'HOST_NO_SHOW'
    | 'CANCELLED'
    | 'SAME_DAY_CANCEL'
    | 'LATE';

export interface IBookingDetail {
    id: number;
    startedAt: Date;
    endedAt: Date;
    topic: string;
    description: string;
    timeSlot: ITimeSlot;
    host: Pick<IUserSimple, 'username' | 'displayName'>;
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

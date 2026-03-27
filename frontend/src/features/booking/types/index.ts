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

export const STATUS_LABELS: Record<AttendanceStatus, string> = {
    SCHEDULED: '예약됨',
    ATTENDED: '참석',
    NO_SHOW: '게스트 노쇼',
    HOST_NO_SHOW: '호스트 노쇼 신고됨',
    CANCELLED: '취소됨',
    SAME_DAY_CANCEL: '당일 취소',
    LATE: '지각',
};

export type MeetingType = 'ONLINE' | 'OFFLINE';

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
    meetingType: MeetingType;
    location: string | null;
    meetingLink: string | null;
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
    meetingType: MeetingType;
    location?: string;
    meetingLink?: string;
}

export interface IBookingUpdatePayload {
    timeSlotId: number;
    when: string;
    topic: string;
    description: string;
    meetingType: MeetingType;
    location?: string;
    meetingLink?: string;
}

export interface IPaginatedBookingDetail {
    bookings: IBookingDetail[];
    totalCount: number;
}

export type BookingRole = 'guest' | 'host';

export interface IBookingWithRole extends IBookingDetail {
    role: BookingRole;
    counterpart: Pick<IUserSimple, 'username' | 'displayName'>;
}

export interface IPaginatedBookingWithRole {
    bookings: IBookingWithRole[];
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

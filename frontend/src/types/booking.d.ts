import type { DateString, ISO8601String } from "./base";
import type { ITimeSlot } from "./timeslot";

// Backend BookingResponseDTO 매핑
export interface IBookingResponse {
    id: number;
    timeSlotId: number;
    guestId: string;
    when: DateString;   // @JsonProperty("when") → bookingDate
    startTime: string;  // "HH:mm:ss"
    endTime: string;    // "HH:mm:ss"
    topic: string;
    description: string;
    attendanceStatus: string;
    googleEventId: string | null;
    createdAt: ISO8601String;
}

// Legacy types for calendar view (Python backend)
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
    id: number
    when: Date
    topic: string
    description: string
    timeSlot: ITimeSlot
    host: IUserSimple
    files: IBookingFile[]
    createdAt: ISO8601String
    updatedAt: ISO8601String
}

export interface IBookingPayload {
    timeSlotId: number
    when: DateString
    topic: string
    description: string
}

export interface IPaginatedBookingDetail {
    bookings: IBookingDetail[]
    totalCount: number
}

export interface IBookingFile {
    id: number
    file: string
}

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

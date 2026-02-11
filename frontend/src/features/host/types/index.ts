import type { ISO8601String, StringTime } from '~/types/base';

// Calendar
export interface CalendarCreatePayload {
    topics: string[];
    description: string;
    googleCalendarId: string;
}

export interface CalendarUpdatePayload {
    topics: string[];
    description: string;
    googleCalendarId: string;
}

export interface CalendarResponse {
    userId: string;
    topics: string[];
    description: string;
    googleCalendarId: string;
    createdAt: ISO8601String;
    updatedAt: ISO8601String;
}

// TimeSlot
export interface TimeSlotCreatePayload {
    startTime: string;
    endTime: string;
    weekdays: number[];
    startDate?: string;
    endDate?: string;
}

export interface TimeSlotResponse {
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

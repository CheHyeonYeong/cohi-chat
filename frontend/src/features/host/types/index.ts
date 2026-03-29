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
    createdAt: string;
    updatedAt: string;
    calendarAccessible: boolean | null;
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
    startedAt: string;
    endedAt: string;
    weekdays: number[];
    startDate: string | null;
    endDate: string | null;
    createdAt: string;
    updatedAt: string;
}

// Host Profile (shared types - re-export)
export type { HostResponseDTO, UpdateProfilePayload } from '~/types/host';

export const CALENDAR_ID_REGEX = /^[a-zA-Z0-9._-]+@group\.calendar\.google\.com$/;

export interface CalendarValidationData {
    topics: string[];
    description: string;
    googleCalendarId: string;
}

export function validateCalendarData(data: CalendarValidationData) {
    const errors: Record<string, string> = {};

    if (data.topics.length === 0) {
        errors.topics = '주제를 최소 1개 이상 입력해주세요.';
    }

    if (data.description.trim().length < 10) {
        errors.description = '소개는 최소 10자 이상 입력해주세요.';
    }

    if (!data.googleCalendarId) {
        errors.googleCalendarId = 'Google Calendar ID를 입력해주세요.';
    } else if (!CALENDAR_ID_REGEX.test(data.googleCalendarId)) {
        errors.googleCalendarId = 'Google Calendar ID 형식이 올바르지 않습니다. (예: xxx@group.calendar.google.com)';
    }

    return errors;
}
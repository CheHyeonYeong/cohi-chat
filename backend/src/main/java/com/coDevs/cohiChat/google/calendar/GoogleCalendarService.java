package com.coDevs.cohiChat.google.calendar;

import java.io.IOException;
import java.time.Instant;
import java.time.ZoneId;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.google.api.client.googleapis.json.GoogleJsonResponseException;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class GoogleCalendarService {

    private final Calendar calendar;
    private final GoogleCalendarProperties properties;
    private final GoogleCalendarConfig googleCalendarConfig;

    public GoogleCalendarService(
        @Autowired(required = false) Calendar calendar,
        GoogleCalendarProperties properties,
        GoogleCalendarConfig googleCalendarConfig
    ) {
        this.calendar = calendar;
        this.properties = properties;
        this.googleCalendarConfig = googleCalendarConfig;
    }

    public String createEvent(
        String summary,
        String description,
        Instant startDateTime,
        Instant endDateTime,
        String googleCalendarId
    ) {
        if (calendar == null) {
            log.warn("Google Calendar service is not initialized");
            return null;
        }

        String calendarId = resolveCalendarId(googleCalendarId);
        Event event = buildEvent(summary, description, startDateTime, endDateTime);

        try {
            Event createdEvent = calendar.events()
                .insert(calendarId, event)
                .setConferenceDataVersion(1)
                .execute();

            log.info("Google Calendar event created: {}", createdEvent.getId());
            return createdEvent.getId();
        } catch (IOException e) {
            log.error("Failed to create Google Calendar event", e);
            return null;
        }
    }

    public boolean updateEvent(
        String eventId,
        String summary,
        String description,
        Instant startDateTime,
        Instant endDateTime,
        String googleCalendarId
    ) {
        if (calendar == null) {
            log.warn("Google Calendar service is not initialized");
            return false;
        }

        String calendarId = resolveCalendarId(googleCalendarId);
        Event event = buildEvent(summary, description, startDateTime, endDateTime);

        try {
            calendar.events()
                .update(calendarId, eventId, event)
                .execute();

            log.info("Google Calendar event updated: {}", eventId);
            return true;
        } catch (IOException e) {
            log.error("Failed to update Google Calendar event: {}", eventId, e);
            return false;
        }
    }

    public boolean deleteEvent(String eventId, String googleCalendarId) {
        if (calendar == null) {
            log.warn("Google Calendar service is not initialized");
            return false;
        }

        String calendarId = resolveCalendarId(googleCalendarId);

        try {
            calendar.events()
                .delete(calendarId, eventId)
                .execute();

            log.info("Google Calendar event deleted: {}", eventId);
            return true;
        } catch (IOException e) {
            log.error("Failed to delete Google Calendar event: {}", eventId, e);
            return false;
        }
    }

    public Event getEvent(String eventId, String googleCalendarId) {
        if (calendar == null) {
            log.warn("Google Calendar service is not initialized");
            return null;
        }

        String calendarId = resolveCalendarId(googleCalendarId);

        try {
            return calendar.events()
                .get(calendarId, eventId)
                .execute();
        } catch (IOException e) {
            log.error("Failed to get Google Calendar event: {}", eventId, e);
            return null;
        }
    }

    public String getServiceAccountEmail() {
        return googleCalendarConfig.getServiceAccountEmail();
    }

    public boolean checkCalendarAccess(String googleCalendarId) {
        if (calendar == null) return true;
        String resolvedId = resolveCalendarId(googleCalendarId);
        if (resolvedId == null || resolvedId.isBlank()) return true;
        try {
            calendar.events().list(resolvedId).setMaxResults(1).execute();
            return true;
        } catch (GoogleJsonResponseException e) {
            if (e.getStatusCode() == 403 || e.getStatusCode() == 404) {
                log.warn("Calendar access denied for calendarId: {} (HTTP {})", googleCalendarId, e.getStatusCode());
                return false;
            }
            // 네트워크/서버 오류는 접근 가능으로 간주 (잘못된 경고 배너 방지)
            log.warn("Google Calendar API error during access check for calendarId: {} (HTTP {}), assuming accessible",
                googleCalendarId, e.getStatusCode());
            return true;
        } catch (IOException e) {
            log.warn("Google Calendar connection error during access check for calendarId: {}, assuming accessible",
                googleCalendarId);
            return true;
        }
    }

    public void validateCalendarAccess(String googleCalendarId) {
        if (calendar == null) {
            log.warn("Google Calendar not configured, skipping access validation");
            return;
        }
        String resolvedId = resolveCalendarId(googleCalendarId);
        if (resolvedId == null || resolvedId.isBlank()) {
            log.warn("Calendar ID not configured, skipping access validation");
            return;
        }
        try {
            calendar.events()
                .list(resolvedId)
                .setMaxResults(1)
                .execute();
        } catch (GoogleJsonResponseException e) {
            if (e.getStatusCode() == 403 || e.getStatusCode() == 404) {
                log.error("Calendar access denied for calendarId: {} (HTTP {})", googleCalendarId, e.getStatusCode());
                throw new CustomException(ErrorCode.GOOGLE_CALENDAR_ACCESS_DENIED);
            }
            log.error("Google Calendar API error for calendarId: {} (HTTP {})", googleCalendarId, e.getStatusCode(), e);
            throw new CustomException(ErrorCode.GOOGLE_CALENDAR_UNAVAILABLE);
        } catch (IOException e) {
            log.error("Google Calendar connection error for calendarId: {}", googleCalendarId, e);
            throw new CustomException(ErrorCode.GOOGLE_CALENDAR_UNAVAILABLE);
        }
    }

    private String resolveCalendarId(String googleCalendarId) {
        return googleCalendarId != null ? googleCalendarId : properties.getDefaultCalendarId();
    }

    private Event buildEvent(
        String summary,
        String description,
        Instant startDateTime,
        Instant endDateTime
    ) {
        Event event = new Event();
        event.setSummary(summary);
        event.setDescription(description);

        String timezone = properties.getTimezone();
        String resolvedTimezone = (timezone != null) ? timezone : ZoneId.systemDefault().getId();

        event.setStart(toEventDateTime(startDateTime, resolvedTimezone));
        event.setEnd(toEventDateTime(endDateTime, resolvedTimezone));

        return event;
    }

    private EventDateTime toEventDateTime(Instant instant, String timezone) {
        DateTime dateTime = new DateTime(instant.toEpochMilli());

        EventDateTime eventDateTime = new EventDateTime();
        eventDateTime.setDateTime(dateTime);
        eventDateTime.setTimeZone(timezone);

        return eventDateTime;
    }
}

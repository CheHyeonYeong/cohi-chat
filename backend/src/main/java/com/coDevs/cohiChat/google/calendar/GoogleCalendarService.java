package com.coDevs.cohiChat.google.calendar;

import java.io.IOException;
import java.time.Instant;
import java.time.ZoneId;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${observability.google-calendar.slow-call-threshold-ms:2000}")
    private long slowCallThresholdMs;

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
            log.debug("[createEvent] [SKIP] reason=SERVICE_NOT_INITIALIZED");
            return null;
        }

        String calendarId = resolveCalendarId(googleCalendarId);
        Event event = buildEvent(summary, description, startDateTime, endDateTime);
        long startNanos = System.nanoTime();

        try {
            Event createdEvent = calendar.events()
                .insert(calendarId, event)
                .setConferenceDataVersion(1)
                .execute();

            logCompletion("createEvent", startNanos);
            return createdEvent.getId();
        } catch (IOException e) {
            log.warn("[createEvent] [FAIL] durationMs={} cause={}",
                elapsedMillis(startNanos), e.getClass().getSimpleName());
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
            log.debug("[updateEvent] [SKIP] reason=SERVICE_NOT_INITIALIZED");
            return false;
        }

        String calendarId = resolveCalendarId(googleCalendarId);
        Event event = buildEvent(summary, description, startDateTime, endDateTime);
        long startNanos = System.nanoTime();

        try {
            calendar.events()
                .update(calendarId, eventId, event)
                .execute();

            logCompletion("updateEvent", startNanos);
            return true;
        } catch (IOException e) {
            log.warn("[updateEvent] [FAIL] durationMs={} cause={}",
                elapsedMillis(startNanos), e.getClass().getSimpleName());
            return false;
        }
    }

    public boolean deleteEvent(String eventId, String googleCalendarId) {
        if (calendar == null) {
            log.debug("[deleteEvent] [SKIP] reason=SERVICE_NOT_INITIALIZED");
            return false;
        }

        String calendarId = resolveCalendarId(googleCalendarId);
        long startNanos = System.nanoTime();

        try {
            calendar.events()
                .delete(calendarId, eventId)
                .execute();

            logCompletion("deleteEvent", startNanos);
            return true;
        } catch (IOException e) {
            log.warn("[deleteEvent] [FAIL] durationMs={} cause={}",
                elapsedMillis(startNanos), e.getClass().getSimpleName());
            return false;
        }
    }

    public Event getEvent(String eventId, String googleCalendarId) {
        if (calendar == null) {
            log.debug("[getEvent] [SKIP] reason=SERVICE_NOT_INITIALIZED");
            return null;
        }

        String calendarId = resolveCalendarId(googleCalendarId);

        try {
            Event event = calendar.events()
                .get(calendarId, eventId)
                .execute();
            log.debug("[getEvent] [SUCCESS]");
            return event;
        } catch (IOException e) {
            log.warn("[getEvent] [FAIL] cause={}", e.getClass().getSimpleName());
            return null;
        }
    }

    public String getServiceAccountEmail() {
        return googleCalendarConfig.getServiceAccountEmail();
    }

    public boolean checkCalendarAccess(String googleCalendarId) {
        if (calendar == null) {
            log.debug("[checkCalendarAccess] [SKIP] reason=SERVICE_NOT_INITIALIZED");
            return true;
        }

        String resolvedId = resolveCalendarId(googleCalendarId);
        if (resolvedId == null || resolvedId.isBlank()) {
            log.debug("[checkCalendarAccess] [SKIP] reason=CALENDAR_ID_NOT_PROVIDED");
            return true;
        }

        try {
            calendar.events().list(resolvedId).setMaxResults(1).execute();
            log.debug("[checkCalendarAccess] [SUCCESS]");
            return true;
        } catch (GoogleJsonResponseException e) {
            if (e.getStatusCode() == 403 || e.getStatusCode() == 404) {
                log.warn("[checkCalendarAccess] [FAIL] status={} reason=ACCESS_DENIED", e.getStatusCode());
                return false;
            }
            log.warn("[checkCalendarAccess] [FAIL] status={} reason=API_ERROR assumeAccessible=true",
                e.getStatusCode());
            return true;
        } catch (IOException e) {
            log.warn("[checkCalendarAccess] [FAIL] reason=IO_ERROR assumeAccessible=true");
            return true;
        }
    }

    public void validateCalendarAccess(String googleCalendarId) {
        if (calendar == null) {
            log.debug("[validateCalendarAccess] [SKIP] reason=SERVICE_NOT_INITIALIZED");
            return;
        }

        String resolvedId = resolveCalendarId(googleCalendarId);
        if (resolvedId == null || resolvedId.isBlank()) {
            log.debug("[validateCalendarAccess] [SKIP] reason=CALENDAR_ID_NOT_PROVIDED");
            return;
        }

        try {
            calendar.events()
                .list(resolvedId)
                .setMaxResults(1)
                .execute();
            log.debug("[validateCalendarAccess] [SUCCESS]");
        } catch (GoogleJsonResponseException e) {
            if (e.getStatusCode() == 403 || e.getStatusCode() == 404) {
                log.warn("[validateCalendarAccess] [FAIL] status={} reason=ACCESS_DENIED", e.getStatusCode());
                throw new CustomException(ErrorCode.GOOGLE_CALENDAR_ACCESS_DENIED);
            }
            log.warn("[validateCalendarAccess] [FAIL] status={} reason=API_ERROR", e.getStatusCode());
            throw new CustomException(ErrorCode.GOOGLE_CALENDAR_UNAVAILABLE);
        } catch (IOException e) {
            log.warn("[validateCalendarAccess] [FAIL] reason=IO_ERROR");
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

    private void logCompletion(String action, long startNanos) {
        long durationMs = elapsedMillis(startNanos);
        if (durationMs >= slowCallThresholdMs) {
            log.warn("[{}] [SLOW] durationMs={} thresholdMs={}", action, durationMs, slowCallThresholdMs);
            return;
        }
        log.info("[{}] [SUCCESS] durationMs={}", action, durationMs);
    }

    private long elapsedMillis(long startNanos) {
        return (System.nanoTime() - startNanos) / 1_000_000;
    }
}

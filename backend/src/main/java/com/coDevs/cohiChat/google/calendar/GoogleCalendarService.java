package com.coDevs.cohiChat.google.calendar;

import java.io.IOException;
import java.time.Instant;
import java.time.ZoneId;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

    public GoogleCalendarService(
        @Autowired(required = false) Calendar calendar,
        GoogleCalendarProperties properties
    ) {
        this.calendar = calendar;
        this.properties = properties;
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

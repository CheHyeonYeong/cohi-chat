package com.coDevs.cohiChat.calendar.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.coDevs.cohiChat.calendar.entity.Calendar;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class CalendarResponseDTO {

    private UUID userId;
    private List<String> topics;
    private String description;
    private String googleCalendarId;
    private Instant createdAt;
    private Instant updatedAt;
    private Boolean calendarAccessible;

    public static CalendarResponseDTO from(Calendar calendar) {
        return CalendarResponseDTO.builder()
            .userId(calendar.getUserId())
            .topics(calendar.getTopics())
            .description(calendar.getDescription())
            .googleCalendarId(calendar.getGoogleCalendarId())
            .createdAt(calendar.getCreatedAt())
            .updatedAt(calendar.getUpdatedAt())
            .build();
    }

    public static CalendarResponseDTO from(Calendar calendar, Boolean calendarAccessible) {
        return CalendarResponseDTO.builder()
            .userId(calendar.getUserId())
            .topics(calendar.getTopics())
            .description(calendar.getDescription())
            .googleCalendarId(calendar.getGoogleCalendarId())
            .createdAt(calendar.getCreatedAt())
            .updatedAt(calendar.getUpdatedAt())
            .calendarAccessible(calendarAccessible)
            .build();
    }
}

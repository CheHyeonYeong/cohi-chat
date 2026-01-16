package com.coDevs.cohiChat.calendar.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.coDevs.cohiChat.calendar.entity.Calendar;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarResponseDTO {

    private UUID id;
    private UUID hostId;
    private List<String> topics;
    private String description;
    private String googleCalendarId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CalendarResponseDTO from(Calendar calendar) {
        return CalendarResponseDTO.builder()
            .id(calendar.getId())
            .hostId(calendar.getHostId())
            .topics(calendar.getTopics())
            .description(calendar.getDescription())
            .googleCalendarId(calendar.getGoogleCalendarId())
            .createdAt(calendar.getCreatedAt())
            .updatedAt(calendar.getUpdatedAt())
            .build();
    }
}

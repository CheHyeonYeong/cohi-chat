package com.coDevs.cohiChat.calendar.response;

import java.util.List;

import com.coDevs.cohiChat.calendar.entity.Calendar;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * 공개 API용 캘린더 응답 DTO.
 * 민감 정보(userId, googleCalendarId) 제외.
 */
@Getter
@Builder
@AllArgsConstructor
public class CalendarPublicResponseDTO {

    private List<String> topics;
    private String description;

    public static CalendarPublicResponseDTO from(Calendar calendar) {
        return CalendarPublicResponseDTO.builder()
            .topics(calendar.getTopics())
            .description(calendar.getDescription())
            .build();
    }
}

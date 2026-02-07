package com.coDevs.cohiChat.timeslot.response;

import java.time.Instant;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import com.coDevs.cohiChat.timeslot.entity.TimeSlot;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class TimeSlotResponseDTO {

    private Long id;
    private UUID userId;
    private LocalTime startTime;
    private LocalTime endTime;
    private List<Integer> weekdays;
    private Instant createdAt;
    private Instant updatedAt;

    public static TimeSlotResponseDTO from(TimeSlot timeSlot) {
        return TimeSlotResponseDTO.builder()
            .id(timeSlot.getId())
            .userId(timeSlot.getUserId())
            .startTime(timeSlot.getStartTime())
            .endTime(timeSlot.getEndTime())
            .weekdays(timeSlot.getWeekdays())
            .createdAt(timeSlot.getCreatedAt())
            .updatedAt(timeSlot.getUpdatedAt())
            .build();
    }
}

package com.coDevs.cohiChat.timeslot.response;

import java.time.LocalTime;
import java.util.List;

import com.coDevs.cohiChat.timeslot.entity.TimeSlot;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * 공개 API용 타임슬롯 응답 DTO.
 * 민감 정보(id, userId, createdAt, updatedAt) 제외.
 */
@Getter
@Builder
@AllArgsConstructor
public class TimeSlotPublicResponseDTO {

    private LocalTime startTime;
    private LocalTime endTime;
    private List<Integer> weekdays;

    public static TimeSlotPublicResponseDTO from(TimeSlot timeSlot) {
        return TimeSlotPublicResponseDTO.builder()
            .startTime(timeSlot.getStartTime())
            .endTime(timeSlot.getEndTime())
            .weekdays(timeSlot.getWeekdays())
            .build();
    }
}

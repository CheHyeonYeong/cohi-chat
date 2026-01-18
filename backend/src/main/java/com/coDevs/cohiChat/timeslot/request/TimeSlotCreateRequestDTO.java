package com.coDevs.cohiChat.timeslot.request;

import java.time.LocalTime;
import java.util.List;

import com.coDevs.cohiChat.timeslot.validation.ValidTimeSlot;
import com.coDevs.cohiChat.timeslot.validation.ValidWeekdays;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ValidTimeSlot
public class TimeSlotCreateRequestDTO {

    @NotNull(message = "시작 시간은 필수 입력 항목입니다.")
    private LocalTime startTime;

    @NotNull(message = "종료 시간은 필수 입력 항목입니다.")
    private LocalTime endTime;

    @NotEmpty(message = "요일은 최소 1개 이상 선택해야 합니다.")
    @ValidWeekdays
    private List<Integer> weekdays;
}

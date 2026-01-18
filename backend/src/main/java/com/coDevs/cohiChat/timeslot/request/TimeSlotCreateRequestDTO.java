package com.coDevs.cohiChat.timeslot.request;

import java.time.LocalTime;
import java.util.List;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class TimeSlotCreateRequestDTO {

    @NotNull(message = "시작 시간은 필수 입력 항목입니다.")
    private LocalTime startTime;

    @NotNull(message = "종료 시간은 필수 입력 항목입니다.")
    private LocalTime endTime;

    @NotEmpty(message = "요일은 최소 1개 이상 선택해야 합니다.")
    private List<Integer> weekdays;

    @AssertTrue(message = "시작 시간은 종료 시간보다 빨라야 합니다.")
    public boolean isValidTimeRange() {
        if (startTime == null || endTime == null) {
            return true;
        }
        return startTime.isBefore(endTime);
    }

    @AssertTrue(message = "요일 값은 0부터 6까지의 값이어야 합니다.")
    public boolean isValidWeekdays() {
        if (weekdays == null || weekdays.isEmpty()) {
            return true;
        }
        return weekdays.stream().allMatch(day -> day != null && day >= 0 && day <= 6);
    }
}

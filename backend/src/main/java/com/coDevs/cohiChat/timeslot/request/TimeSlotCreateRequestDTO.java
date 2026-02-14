package com.coDevs.cohiChat.timeslot.request;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;

import io.swagger.v3.oas.annotations.media.Schema;
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
    @JsonFormat(pattern = "HH:mm:ss")
    @Schema(example = "09:00:00", type = "string")
    private LocalTime startTime;

    @NotNull(message = "종료 시간은 필수 입력 항목입니다.")
    @JsonFormat(pattern = "HH:mm:ss")
    @Schema(example = "18:00:00", type = "string")
    private LocalTime endTime;

    @NotEmpty(message = "요일은 최소 1개 이상 선택해야 합니다.")
    private List<Integer> weekdays;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Schema(example = "2025-03-01", type = "string")
    private LocalDate startDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Schema(example = "2025-06-30", type = "string")
    private LocalDate endDate;

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

    @AssertTrue(message = "시작일과 종료일은 함께 입력하거나, 둘 다 비워야 합니다.")
    public boolean isValidDateRange() {
        if (startDate == null && endDate == null) {
            return true;
        }
        if (startDate == null || endDate == null) {
            return false;
        }
        return !startDate.isAfter(endDate);
    }
}

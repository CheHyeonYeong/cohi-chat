package com.coDevs.cohiChat.booking.request;

import java.time.LocalDate;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingScheduleUpdateRequestDTO {

    @NotNull(message = "타임슬롯 ID는 필수 입력 항목입니다.")
    private Long timeSlotId;

    @NotNull(message = "예약 날짜는 필수 입력 항목입니다.")
    @FutureOrPresent(message = "예약 날짜는 오늘 이후여야 합니다.")
    private LocalDate bookingDate;
}

package com.coDevs.cohiChat.booking.request;

import com.coDevs.cohiChat.booking.entity.AttendanceStatus;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingStatusUpdateRequestDTO {

    @NotNull(message = "상태는 필수 입력 항목입니다.")
    private AttendanceStatus status;
}

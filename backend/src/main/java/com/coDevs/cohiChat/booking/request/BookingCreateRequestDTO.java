package com.coDevs.cohiChat.booking.request;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingCreateRequestDTO {

    @NotNull(message = "타임슬롯 ID는 필수 입력 항목입니다.")
    private Long timeSlotId;

    @JsonProperty("when")
    @NotNull(message = "예약 날짜는 필수 입력 항목입니다.")
    @FutureOrPresent(message = "예약 날짜는 오늘 이후여야 합니다.")
    private LocalDate bookingDate;

    @NotBlank(message = "상담 주제는 필수 입력 항목입니다.")
    @Size(max = 255, message = "상담 주제는 255자 이내로 입력해주세요.")
    private String topic;

    @NotBlank(message = "상담 설명은 필수 입력 항목입니다.")
    @Size(max = 2000, message = "상담 설명은 2000자 이내로 입력해주세요.")
    private String description;
}

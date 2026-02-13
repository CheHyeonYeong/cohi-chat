package com.coDevs.cohiChat.booking.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoShowReportRequestDTO {

    @Size(max = 255, message = "사유는 255자 이하로 입력해주세요.")
    private String reason;
}

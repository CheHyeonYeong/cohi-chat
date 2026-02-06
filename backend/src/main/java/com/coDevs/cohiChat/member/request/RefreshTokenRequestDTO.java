package com.coDevs.cohiChat.member.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshTokenRequestDTO {

    @NotBlank(message = "리프레시 토큰은 필수입니다.")
    private String refreshToken;
}

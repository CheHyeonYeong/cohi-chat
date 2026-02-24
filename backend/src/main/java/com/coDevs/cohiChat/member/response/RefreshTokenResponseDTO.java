package com.coDevs.cohiChat.member.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshTokenResponseDTO {

    private String accessToken;
    private String refreshToken;
    private long expiredInMinutes;
}

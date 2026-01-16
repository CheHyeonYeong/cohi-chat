package com.coDevs.cohiChat.member.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponseDTO {

	private String accessToken;
	private long expiredInMinutes;
	private String refreshToken;
	private String username;
	private String displayName;

}
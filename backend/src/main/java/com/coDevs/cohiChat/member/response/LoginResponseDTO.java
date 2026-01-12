package com.coDevs.cohiChat.member.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class LoginResponseDTO {

	private String accessToken;

	@Builder.Default
	private String tokenType = "Bearer";

	private String refreshToken;
	private String username;
	private String displayName;

	public static LoginResponseDTO of(String accessToken, String username, String displayName) {
		return LoginResponseDTO.builder()
			.accessToken(accessToken)
			.username(username)
			.displayName(displayName)
			.build();
	}
}
package com.coDevs.cohiChat.auth.response;

import lombok.Builder;

@Builder
public record LoginResponseDTO(
	String accessToken,
	String tokenType,
	String refreshToken,
	String username,
	String displayName
) {
	public static LoginResponseDTO of(String accessToken, String username, String displayName) {
		return LoginResponseDTO.builder()
			.accessToken(accessToken)
			.tokenType("Bearer")
			.refreshToken(null)
			.username(username)
			.displayName(displayName)
			.build();
	}
}

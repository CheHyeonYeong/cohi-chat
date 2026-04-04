package com.coDevs.cohiChat.member.response;

import lombok.Builder;

@Builder
public record LoginResponseDTO(
	String accessToken,
	long expiredInMinutes,
	String refreshToken,
	String username,
	String displayName
) {
	public SafeLoginResponseDTO toSafeResponse() {
		return new SafeLoginResponseDTO(username, displayName, expiredInMinutes);
	}
}

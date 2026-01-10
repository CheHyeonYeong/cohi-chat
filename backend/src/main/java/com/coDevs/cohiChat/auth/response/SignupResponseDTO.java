package com.coDevs.cohiChat.auth.response;

import java.util.UUID;

public record SignupResponseDTO(
	UUID id,
	String username,
	String displayName
) {
	public static SignupResponseDTO of(UUID id, String username, String displayName) {
		return new SignupResponseDTO(id, username, displayName);
	}
}

package com.coDevs.cohiChat.member.response;

import java.util.UUID;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SignupResponseDTO {

	private UUID id;
	private String username;
	private String displayName;

	private SignupResponseDTO(UUID id, String username, String displayName) {
		this.id = id;
		this.username = username;
		this.displayName = displayName;
	}

	public static SignupResponseDTO of(UUID id, String username, String displayName) {
		return new SignupResponseDTO(id, username, displayName);
	}
}
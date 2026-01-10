package com.coDevs.cohiChat.auth.request;

import com.coDevs.cohiChat.auth.entity.AuthProvider;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SuperBuilder
public class LocalLoginRequestDTO extends LoginRequestDTO {

	private String username;
	private String password;

	public static LocalLoginRequestDTO of(String username, String password) {
		return LocalLoginRequestDTO.builder()
			.provider(AuthProvider.LOCAL)
			.username(username)
			.password(password)
			.build();
	}
}
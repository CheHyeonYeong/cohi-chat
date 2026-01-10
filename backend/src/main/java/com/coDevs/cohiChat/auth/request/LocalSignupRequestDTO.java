package com.coDevs.cohiChat.auth.request;

import com.coDevs.cohiChat.auth.entity.AuthProvider;
import com.coDevs.cohiChat.member.entity.Role;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SuperBuilder
public class LocalSignupRequestDTO extends SignupRequestDTO {

	private String username;
	private String password;

	public static LocalSignupRequestDTO of(
		String username,
		String password,
		String email,
		String displayName,
		Role role
	) {
		return LocalSignupRequestDTO.builder()
			.provider(AuthProvider.LOCAL)
			.username(username)
			.password(password)
			.email(email)
			.displayName(displayName)
			.role(role != null ? role : Role.GUEST)
			.build();
	}
}
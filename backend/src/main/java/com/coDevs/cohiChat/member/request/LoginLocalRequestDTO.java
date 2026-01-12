package com.coDevs.cohiChat.member.request;

import com.coDevs.cohiChat.member.entity.AuthProvider;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LoginLocalRequestDTO {

	private String username;
	private String password;
	private AuthProvider provider;

	private LoginLocalRequestDTO(String username, String password, AuthProvider provider) {
		this.username = username;
		this.password = password;
		this.provider = provider;
	}

	public static LoginLocalRequestDTO of(String username, String password) {
		return new LoginLocalRequestDTO(username, password, AuthProvider.LOCAL);
	}
}
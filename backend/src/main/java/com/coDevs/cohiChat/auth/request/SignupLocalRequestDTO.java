package com.coDevs.cohiChat.auth.request;

import com.coDevs.cohiChat.auth.entity.AuthProvider;
import com.coDevs.cohiChat.member.entity.Role;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignupLocalRequestDTO {

	private String username;
	private String password;
	private String email;
	private String displayName;

	@Builder.Default
	private AuthProvider provider = AuthProvider.LOCAL;

	@Builder.Default
	private Role role = Role.GUEST;

}
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
public abstract class SignupRequestDTO {

	private AuthProvider provider;
	private String displayName;
	private String email;
	private Role role;
}
package com.coDevs.cohiChat.member.request;

import com.coDevs.cohiChat.member.entity.Provider;
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
	private Provider provider = Provider.LOCAL;

	@Builder.Default
	private Role role = Role.GUEST;

}
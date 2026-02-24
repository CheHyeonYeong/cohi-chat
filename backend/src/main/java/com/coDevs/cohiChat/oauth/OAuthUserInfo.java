package com.coDevs.cohiChat.oauth;

import com.coDevs.cohiChat.member.entity.Provider;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class OAuthUserInfo {
	private final Provider provider;
	private final String providerId;
	private final String email;
	private final String displayName;
}

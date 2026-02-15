package com.coDevs.cohiChat.oauth;

import com.coDevs.cohiChat.member.entity.Provider;

public interface OAuthClient {

	Provider getProvider();

	String getAuthorizationUrl();

	OAuthUserInfo getUserInfo(String authorizationCode);
}

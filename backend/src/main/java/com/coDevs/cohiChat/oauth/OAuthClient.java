package com.coDevs.cohiChat.oauth;

import com.coDevs.cohiChat.member.entity.Provider;

public interface OAuthClient {

	Provider getProvider();

	String getAuthorizationUrl(String state);

	OAuthUserInfo getUserInfo(String authorizationCode);
}

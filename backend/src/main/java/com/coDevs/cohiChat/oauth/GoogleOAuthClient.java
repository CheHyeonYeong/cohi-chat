package com.coDevs.cohiChat.oauth;

import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.entity.Provider;

@Component
public class GoogleOAuthClient implements OAuthClient {

	private static final String AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth";
	private static final String TOKEN_URL = "https://oauth2.googleapis.com/token";
	private static final String USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
	private static final String SCOPE = "openid email profile";

	private final OAuthProperties.ProviderConfig config;
	private final RestClient restClient;

	public GoogleOAuthClient(OAuthProperties properties, RestClient restClient) {
		this.config = properties.getGoogle();
		this.restClient = restClient;
	}

	@Override
	public Provider getProvider() {
		return Provider.GOOGLE;
	}

	@Override
	public String getAuthorizationUrl(String state) {
		return AUTHORIZATION_URL
			+ "?client_id=" + OAuthClientUtils.encode(config.getClientId())
			+ "&redirect_uri=" + OAuthClientUtils.encode(config.getRedirectUri())
			+ "&response_type=code"
			+ "&scope=" + OAuthClientUtils.encode(SCOPE)
			+ "&state=" + OAuthClientUtils.encode(state);
	}

	@Override
	@SuppressWarnings("unchecked")
	public OAuthUserInfo getUserInfo(String authorizationCode) {
		String accessToken = exchangeToken(authorizationCode);

		Map<String, Object> userInfo;
		try {
			userInfo = restClient.get()
				.uri(USERINFO_URL)
				.header("Authorization", "Bearer " + accessToken)
				.retrieve()
				.body(Map.class);
		} catch (RestClientException e) {
			throw new CustomException(ErrorCode.OAUTH_USER_INFO_FAILED);
		}

		if (userInfo == null) {
			throw new CustomException(ErrorCode.OAUTH_USER_INFO_FAILED);
		}

		String sub = (String) userInfo.get("sub");
		String email = (String) userInfo.get("email");
		String name = (String) userInfo.get("name");

		if (sub == null || email == null) {
			throw new CustomException(ErrorCode.OAUTH_USER_INFO_FAILED);
		}

		return new OAuthUserInfo(Provider.GOOGLE, sub, email, name);
	}

	@SuppressWarnings("unchecked")
	private String exchangeToken(String authorizationCode) {
		String body = "grant_type=authorization_code"
			+ "&code=" + OAuthClientUtils.encode(authorizationCode)
			+ "&client_id=" + OAuthClientUtils.encode(config.getClientId())
			+ "&client_secret=" + OAuthClientUtils.encode(config.getClientSecret())
			+ "&redirect_uri=" + OAuthClientUtils.encode(config.getRedirectUri());

		Map<String, Object> response;
		try {
			response = restClient.post()
				.uri(TOKEN_URL)
				.contentType(MediaType.APPLICATION_FORM_URLENCODED)
				.body(body)
				.retrieve()
				.body(Map.class);
		} catch (RestClientException e) {
			throw new CustomException(ErrorCode.OAUTH_TOKEN_EXCHANGE_FAILED);
		}

		if (response == null || response.get("access_token") == null) {
			throw new CustomException(ErrorCode.OAUTH_TOKEN_EXCHANGE_FAILED);
		}

		return (String) response.get("access_token");
	}

}

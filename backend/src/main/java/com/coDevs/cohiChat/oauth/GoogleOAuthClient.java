package com.coDevs.cohiChat.oauth;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

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
	public String getAuthorizationUrl() {
		return AUTHORIZATION_URL
			+ "?client_id=" + encode(config.getClientId())
			+ "&redirect_uri=" + encode(config.getRedirectUri())
			+ "&response_type=code"
			+ "&scope=" + encode(SCOPE);
	}

	@Override
	@SuppressWarnings("unchecked")
	public OAuthUserInfo getUserInfo(String authorizationCode) {
		String accessToken = exchangeToken(authorizationCode);

		Map<String, Object> userInfo = restClient.get()
			.uri(USERINFO_URL)
			.header("Authorization", "Bearer " + accessToken)
			.retrieve()
			.body(Map.class);

		return new OAuthUserInfo(
			Provider.GOOGLE,
			(String) userInfo.get("sub"),
			(String) userInfo.get("email"),
			(String) userInfo.get("name")
		);
	}

	@SuppressWarnings("unchecked")
	private String exchangeToken(String authorizationCode) {
		String body = "grant_type=authorization_code"
			+ "&code=" + encode(authorizationCode)
			+ "&client_id=" + encode(config.getClientId())
			+ "&client_secret=" + encode(config.getClientSecret())
			+ "&redirect_uri=" + encode(config.getRedirectUri());

		Map<String, Object> response = restClient.post()
			.uri(TOKEN_URL)
			.contentType(MediaType.APPLICATION_FORM_URLENCODED)
			.body(body)
			.retrieve()
			.body(Map.class);

		return (String) response.get("access_token");
	}

	private static String encode(String value) {
		return URLEncoder.encode(value, StandardCharsets.UTF_8);
	}
}

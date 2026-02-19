package com.coDevs.cohiChat.oauth;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.entity.Provider;

@Component
public class KakaoOAuthClient implements OAuthClient {

	private static final String AUTHORIZATION_URL = "https://kauth.kakao.com/oauth/authorize";
	private static final String TOKEN_URL = "https://kauth.kakao.com/oauth/token";
	private static final String USERINFO_URL = "https://kapi.kakao.com/v2/user/me";

	private final OAuthProperties.ProviderConfig config;
	private final RestClient restClient;

	public KakaoOAuthClient(OAuthProperties properties, RestClient restClient) {
		this.config = properties.getKakao();
		this.restClient = restClient;
	}

	@Override
	public Provider getProvider() {
		return Provider.KAKAO;
	}

	@Override
	public String getAuthorizationUrl() {
		return AUTHORIZATION_URL
			+ "?client_id=" + encode(config.getClientId())
			+ "&redirect_uri=" + encode(config.getRedirectUri())
			+ "&response_type=code";
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

		Object idObj = userInfo.get("id");
		if (idObj == null) {
			throw new CustomException(ErrorCode.OAUTH_USER_INFO_FAILED);
		}
		String providerId = String.valueOf(idObj);

		Map<String, Object> kakaoAccount = (Map<String, Object>) userInfo.get("kakao_account");
		String email = null;
		String nickname = null;

		if (kakaoAccount != null) {
			email = (String) kakaoAccount.get("email");
			Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
			if (profile != null) {
				nickname = (String) profile.get("nickname");
			}
		}

		if (email == null) {
			throw new CustomException(ErrorCode.OAUTH_USER_INFO_FAILED);
		}

		return new OAuthUserInfo(Provider.KAKAO, providerId, email, nickname);
	}

	@SuppressWarnings("unchecked")
	private String exchangeToken(String authorizationCode) {
		String body = "grant_type=authorization_code"
			+ "&code=" + encode(authorizationCode)
			+ "&client_id=" + encode(config.getClientId())
			+ "&client_secret=" + encode(config.getClientSecret())
			+ "&redirect_uri=" + encode(config.getRedirectUri());

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

	private static String encode(String value) {
		return URLEncoder.encode(value, StandardCharsets.UTF_8);
	}
}

package com.coDevs.cohiChat.oauth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;

import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

import com.coDevs.cohiChat.member.entity.Provider;

@ExtendWith(MockitoExtension.class)
class KakaoOAuthClientTest {

	private KakaoOAuthClient kakaoOAuthClient;

	@Mock
	private RestClient restClient;

	@Mock
	private RestClient.RequestBodyUriSpec requestBodyUriSpec;

	@Mock
	private RestClient.RequestBodySpec requestBodySpec;

	@Mock
	private RestClient.ResponseSpec tokenResponseSpec;

	@Mock
	private RestClient.ResponseSpec userInfoResponseSpec;

	@Mock
	private RestClient.RequestHeadersUriSpec<?> requestHeadersUriSpec;

	@Mock
	private RestClient.RequestHeadersSpec<?> requestHeadersSpec;

	@BeforeEach
	void setUp() {
		OAuthProperties.ProviderConfig config = new OAuthProperties.ProviderConfig();
		config.setClientId("kakao-client-id");
		config.setClientSecret("kakao-client-secret");
		config.setRedirectUri("http://localhost:3000/oauth/callback/kakao");

		OAuthProperties properties = new OAuthProperties();
		properties.setKakao(config);

		kakaoOAuthClient = new KakaoOAuthClient(properties, restClient);
	}

	@Test
	@DisplayName("provider는 KAKAO이다")
	void getProvider() {
		assertThat(kakaoOAuthClient.getProvider()).isEqualTo(Provider.KAKAO);
	}

	@Test
	@DisplayName("Authorization URL이 올바르게 생성된다")
	void getAuthorizationUrl() {
		String url = kakaoOAuthClient.getAuthorizationUrl("test-state-value");

		assertThat(url).contains("https://kauth.kakao.com/oauth/authorize");
		assertThat(url).contains("client_id=kakao-client-id");
		assertThat(url).contains("redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Foauth%2Fcallback%2Fkakao");
		assertThat(url).contains("response_type=code");
		assertThat(url).contains("state=test-state-value");
	}

	@SuppressWarnings("unchecked")
	@Test
	@DisplayName("인가코드로 사용자 정보를 정상 조회한다")
	void getUserInfoSuccess() {
		// token exchange mock
		Map<String, Object> tokenResponse = Map.of("access_token", "kakao-access-token");
		given(restClient.post()).willReturn(requestBodyUriSpec);
		given(requestBodyUriSpec.uri("https://kauth.kakao.com/oauth/token")).willReturn(requestBodySpec);
		given(requestBodySpec.contentType(MediaType.APPLICATION_FORM_URLENCODED)).willReturn(requestBodySpec);
		given(requestBodySpec.body(any(String.class))).willReturn(requestBodySpec);
		given(requestBodySpec.retrieve()).willReturn(tokenResponseSpec);
		given(tokenResponseSpec.body(eq(Map.class))).willReturn(tokenResponse);

		// userinfo mock
		Map<String, Object> kakaoAccount = Map.of(
			"email", "user@kakao.com",
			"profile", Map.of("nickname", "KakaoUser")
		);
		Map<String, Object> userInfoResponse = Map.of(
			"id", 12345L,
			"kakao_account", kakaoAccount
		);
		given(restClient.get()).willReturn((RestClient.RequestHeadersUriSpec) requestHeadersUriSpec);
		given(requestHeadersUriSpec.uri("https://kapi.kakao.com/v2/user/me")).willReturn((RestClient.RequestHeadersSpec) requestHeadersSpec);
		given(requestHeadersSpec.header(eq("Authorization"), eq("Bearer kakao-access-token"))).willReturn((RestClient.RequestHeadersSpec) requestHeadersSpec);
		given(requestHeadersSpec.retrieve()).willReturn(userInfoResponseSpec);
		given(userInfoResponseSpec.body(eq(Map.class))).willReturn(userInfoResponse);

		OAuthUserInfo userInfo = kakaoOAuthClient.getUserInfo("test-auth-code");

		assertThat(userInfo.getProvider()).isEqualTo(Provider.KAKAO);
		assertThat(userInfo.getProviderId()).isEqualTo("12345");
		assertThat(userInfo.getEmail()).isEqualTo("user@kakao.com");
		assertThat(userInfo.getDisplayName()).isEqualTo("KakaoUser");
	}
}

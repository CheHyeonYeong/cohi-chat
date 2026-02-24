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
class GoogleOAuthClientTest {

	private GoogleOAuthClient googleOAuthClient;

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
		config.setClientId("test-client-id");
		config.setClientSecret("test-client-secret");
		config.setRedirectUri("http://localhost:3000/oauth/callback/google");

		OAuthProperties properties = new OAuthProperties();
		properties.setGoogle(config);

		googleOAuthClient = new GoogleOAuthClient(properties, restClient);
	}

	@Test
	@DisplayName("provider는 GOOGLE이다")
	void getProvider() {
		assertThat(googleOAuthClient.getProvider()).isEqualTo(Provider.GOOGLE);
	}

	@Test
	@DisplayName("Authorization URL이 올바르게 생성된다")
	void getAuthorizationUrl() {
		String url = googleOAuthClient.getAuthorizationUrl("test-state-value");

		assertThat(url).contains("https://accounts.google.com/o/oauth2/v2/auth");
		assertThat(url).contains("client_id=test-client-id");
		assertThat(url).contains("redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Foauth%2Fcallback%2Fgoogle");
		assertThat(url).contains("response_type=code");
		assertThat(url).contains("scope=");
		assertThat(url).contains("state=test-state-value");
	}

	@SuppressWarnings("unchecked")
	@Test
	@DisplayName("인가코드로 사용자 정보를 정상 조회한다")
	void getUserInfoSuccess() {
		// token exchange mock
		Map<String, Object> tokenResponse = Map.of("access_token", "mock-access-token");
		given(restClient.post()).willReturn(requestBodyUriSpec);
		given(requestBodyUriSpec.uri("https://oauth2.googleapis.com/token")).willReturn(requestBodySpec);
		given(requestBodySpec.contentType(MediaType.APPLICATION_FORM_URLENCODED)).willReturn(requestBodySpec);
		given(requestBodySpec.body(any(String.class))).willReturn(requestBodySpec);
		given(requestBodySpec.retrieve()).willReturn(tokenResponseSpec);
		given(tokenResponseSpec.body(eq(Map.class))).willReturn(tokenResponse);

		// userinfo mock
		Map<String, Object> userInfoResponse = Map.of(
			"sub", "google-user-id-123",
			"email", "user@gmail.com",
			"name", "Test User"
		);
		given(restClient.get()).willReturn((RestClient.RequestHeadersUriSpec) requestHeadersUriSpec);
		given(requestHeadersUriSpec.uri("https://www.googleapis.com/oauth2/v3/userinfo")).willReturn((RestClient.RequestHeadersSpec) requestHeadersSpec);
		given(requestHeadersSpec.header(eq("Authorization"), eq("Bearer mock-access-token"))).willReturn((RestClient.RequestHeadersSpec) requestHeadersSpec);
		given(requestHeadersSpec.retrieve()).willReturn(userInfoResponseSpec);
		given(userInfoResponseSpec.body(eq(Map.class))).willReturn(userInfoResponse);

		OAuthUserInfo userInfo = googleOAuthClient.getUserInfo("test-auth-code");

		assertThat(userInfo.getProvider()).isEqualTo(Provider.GOOGLE);
		assertThat(userInfo.getProviderId()).isEqualTo("google-user-id-123");
		assertThat(userInfo.getEmail()).isEqualTo("user@gmail.com");
		assertThat(userInfo.getDisplayName()).isEqualTo("Test User");
	}
}

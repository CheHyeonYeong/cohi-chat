package com.coDevs.cohiChat.oauth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.global.security.jwt.TokenService;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Provider;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.member.response.LoginResponseDTO;

@ExtendWith(MockitoExtension.class)
class OAuthServiceTest {

	@Mock
	private OAuthMemberService oAuthMemberService;

	@Mock
	private TokenService tokenService;

	@Mock
	private OAuthStateService oAuthStateService;

	@Mock
	private OAuthClient googleOAuthClient;

	@Mock
	private OAuthClient kakaoOAuthClient;

	private OAuthService oAuthService;

	@BeforeEach
	void setUp() {
		given(googleOAuthClient.getProvider()).willReturn(Provider.GOOGLE);
		given(kakaoOAuthClient.getProvider()).willReturn(Provider.KAKAO);

		oAuthService = new OAuthService(
			oAuthMemberService,
			tokenService,
			oAuthStateService,
			List.of(googleOAuthClient, kakaoOAuthClient)
		);
	}

	@Test
	@DisplayName("Google Authorization URL을 반환한다")
	void getAuthorizationUrl_google() {
		given(oAuthStateService.generateState()).willReturn("test-state");
		given(googleOAuthClient.getAuthorizationUrl("test-state")).willReturn("https://accounts.google.com/o/oauth2/v2/auth?...");

		String url = oAuthService.getAuthorizationUrl("google");

		assertThat(url).contains("google.com");
	}

	@Test
	@DisplayName("지원하지 않는 provider 요청 시 예외")
	void getAuthorizationUrl_unsupportedProvider() {
		assertThatThrownBy(() -> oAuthService.getAuthorizationUrl("github"))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PROVIDER);
	}

	@Test
	@DisplayName("소셜 로그인 - 신규 회원은 자동 가입 후 JWT 발급")
	void socialLogin_newUser() {
		OAuthUserInfo userInfo = new OAuthUserInfo(Provider.GOOGLE, "google-123", "new@gmail.com", "NewUser");
		Member newMember = Member.createOAuth("google_google-123", "NewUser", "new@gmail.com", "google-123", Provider.GOOGLE, Role.GUEST);
		LoginResponseDTO expectedResponse = LoginResponseDTO.builder()
			.accessToken("test-access-token")
			.expiredInMinutes(60)
			.refreshToken("test-refresh-token")
			.username("google_google-123")
			.displayName("NewUser")
			.build();

		given(googleOAuthClient.getUserInfo("auth-code")).willReturn(userInfo);
		given(oAuthMemberService.findOrCreate(userInfo)).willReturn(newMember);
		given(tokenService.issueTokens(newMember)).willReturn(expectedResponse);

		LoginResponseDTO response = oAuthService.socialLogin("google", "auth-code", "valid-state");

		assertThat(response.getAccessToken()).isEqualTo("test-access-token");
		assertThat(response.getRefreshToken()).isEqualTo("test-refresh-token");
		verify(oAuthMemberService).findOrCreate(userInfo);
		verify(oAuthStateService).validateAndConsumeState("valid-state");
	}

	@Test
	@DisplayName("소셜 로그인 - 기존 회원은 JWT만 발급")
	void socialLogin_existingUser() {
		Member existingMember = Member.createOAuth("google_existing", "ExistingUser", "existing@gmail.com", "existing", Provider.GOOGLE, Role.GUEST);
		OAuthUserInfo userInfo = new OAuthUserInfo(Provider.GOOGLE, "google-456", "existing@gmail.com", "ExistingUser");
		LoginResponseDTO expectedResponse = LoginResponseDTO.builder()
			.accessToken("test-access-token")
			.expiredInMinutes(60)
			.refreshToken("test-refresh-token")
			.username("google_existing")
			.displayName("ExistingUser")
			.build();

		given(googleOAuthClient.getUserInfo("auth-code")).willReturn(userInfo);
		given(oAuthMemberService.findOrCreate(userInfo)).willReturn(existingMember);
		given(tokenService.issueTokens(existingMember)).willReturn(expectedResponse);

		LoginResponseDTO response = oAuthService.socialLogin("google", "auth-code", "valid-state");

		assertThat(response.getAccessToken()).isEqualTo("test-access-token");
		assertThat(response.getUsername()).isEqualTo("google_existing");
		verify(oAuthMemberService).findOrCreate(userInfo);
	}

	@Test
	@DisplayName("소셜 로그인 - 유효하지 않은 state 시 INVALID_OAUTH_STATE 예외")
	void socialLogin_invalidState() {
		org.mockito.BDDMockito.willThrow(new CustomException(ErrorCode.INVALID_OAUTH_STATE))
			.given(oAuthStateService).validateAndConsumeState("invalid-state");

		assertThatThrownBy(() -> oAuthService.socialLogin("google", "auth-code", "invalid-state"))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_OAUTH_STATE);
	}

	@Test
	@DisplayName("소셜 로그인 - 지원하지 않는 provider 시 예외")
	void socialLogin_unsupportedProvider() {
		assertThatThrownBy(() -> oAuthService.socialLogin("github", "auth-code", "valid-state"))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PROVIDER);
	}
}

package com.coDevs.cohiChat.global.security.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletResponse;

import com.coDevs.cohiChat.global.security.jwt.JwtTokenProvider;
import com.coDevs.cohiChat.member.response.LoginResponseDTO;
import com.coDevs.cohiChat.member.response.RefreshTokenResponseDTO;

@ExtendWith(MockitoExtension.class)
class AuthCookieServiceTest {

	@Mock
	private JwtTokenProvider jwtTokenProvider;

	private AuthCookieService authCookieService;

	@BeforeEach
	void setUp() {
		AuthProperties authProperties = new AuthProperties();
		authCookieService = new AuthCookieService(authProperties, jwtTokenProvider);
	}

	@Test
	@DisplayName("로그인 쿠키에 access/refresh 토큰이 설정된다")
	void addLoginCookies_setsAccessAndRefreshCookies() {
		MockHttpServletResponse response = new MockHttpServletResponse();
		LoginResponseDTO loginResponse = LoginResponseDTO.builder()
			.accessToken("access-token")
			.refreshToken("refresh-token")
			.build();

		given(jwtTokenProvider.getAccessTokenExpirationMs()).willReturn(3_600_000L);
		given(jwtTokenProvider.getRefreshTokenExpirationMs()).willReturn(604_800_000L);

		authCookieService.addLoginCookies(response, loginResponse);

		List<String> setCookieHeaders = response.getHeaders(HttpHeaders.SET_COOKIE);
		assertThat(setCookieHeaders).hasSize(2);
		assertThat(setCookieHeaders)
			.anySatisfy(cookie -> assertThat(cookie)
				.contains("cohi_access_token=access-token")
				.contains("HttpOnly")
				.contains("Path=/api")
				.contains("SameSite=Lax"))
			.anySatisfy(cookie -> assertThat(cookie)
				.contains("cohi_refresh_token=refresh-token")
				.contains("HttpOnly")
				.contains("Max-Age=604800")); // 신규 발급 → 전체 만료 시간 사용
	}

	@Test
	@DisplayName("refresh 쿠키의 refresh token maxAge는 토큰 남은 유효 시간을 사용한다")
	void addRefreshCookies_usesRemainingExpirationForRefreshToken() {
		MockHttpServletResponse response = new MockHttpServletResponse();
		RefreshTokenResponseDTO refreshResponse = RefreshTokenResponseDTO.builder()
			.accessToken("new-access-token")
			.refreshToken("new-refresh-token")
			.build();

		given(jwtTokenProvider.getAccessTokenExpirationMs()).willReturn(3_600_000L);
		given(jwtTokenProvider.getExpirationSeconds("new-refresh-token")).willReturn(259_200L); // 3일 남음

		authCookieService.addRefreshCookies(response, refreshResponse);

		List<String> setCookieHeaders = response.getHeaders(HttpHeaders.SET_COOKIE);
		assertThat(setCookieHeaders).hasSize(2);
		assertThat(setCookieHeaders)
			.anySatisfy(cookie -> assertThat(cookie)
				.contains("cohi_access_token=new-access-token")
				.contains("HttpOnly")
				.contains("Max-Age=3600"))
			.anySatisfy(cookie -> assertThat(cookie)
				.contains("cohi_refresh_token=new-refresh-token")
				.contains("HttpOnly")
				.contains("Max-Age=259200")); // 전체 7일이 아닌 남은 3일
	}

	@Test
	@DisplayName("refresh token이 이미 만료됐으면 maxAge=0으로 즉시 만료 처리한다")
	void addRefreshCookies_treatsNegativeExpirationAsZero() {
		MockHttpServletResponse response = new MockHttpServletResponse();
		RefreshTokenResponseDTO refreshResponse = RefreshTokenResponseDTO.builder()
			.accessToken("new-access-token")
			.refreshToken("expired-refresh-token")
			.build();

		given(jwtTokenProvider.getAccessTokenExpirationMs()).willReturn(3_600_000L);
		given(jwtTokenProvider.getExpirationSeconds("expired-refresh-token")).willReturn(-10L);

		authCookieService.addRefreshCookies(response, refreshResponse);

		List<String> setCookieHeaders = response.getHeaders(HttpHeaders.SET_COOKIE);
		assertThat(setCookieHeaders)
			.anySatisfy(cookie -> assertThat(cookie)
				.contains("cohi_refresh_token=expired-refresh-token")
				.contains("Max-Age=0"));
	}

	@Test
	@DisplayName("로그아웃 쿠키를 만료 처리한다")
	void clearAuthCookies_expiresCookies() {
		MockHttpServletResponse response = new MockHttpServletResponse();

		authCookieService.clearAuthCookies(response);

		List<String> setCookieHeaders = response.getHeaders(HttpHeaders.SET_COOKIE);
		assertThat(setCookieHeaders).hasSize(2);
		assertThat(setCookieHeaders)
			.anySatisfy(cookie -> assertThat(cookie)
				.contains("cohi_access_token=")
				.contains("Max-Age=0"))
			.anySatisfy(cookie -> assertThat(cookie)
				.contains("cohi_refresh_token=")
				.contains("Max-Age=0"));
	}
}

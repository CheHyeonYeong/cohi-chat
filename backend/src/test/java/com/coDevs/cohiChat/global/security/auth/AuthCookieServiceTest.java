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
				.contains("HttpOnly"));
	}

	@Test
	@DisplayName("refresh 쿠키에 access/refresh 토큰이 갱신된다")
	void addRefreshCookies_setsAccessAndRefreshCookies() {
		MockHttpServletResponse response = new MockHttpServletResponse();
		RefreshTokenResponseDTO refreshResponse = RefreshTokenResponseDTO.builder()
			.accessToken("new-access-token")
			.refreshToken("new-refresh-token")
			.build();

		given(jwtTokenProvider.getAccessTokenExpirationMs()).willReturn(3_600_000L);
		given(jwtTokenProvider.getRefreshTokenExpirationMs()).willReturn(604_800_000L);

		authCookieService.addRefreshCookies(response, refreshResponse);

		List<String> setCookieHeaders = response.getHeaders(HttpHeaders.SET_COOKIE);
		assertThat(setCookieHeaders).hasSize(2);
		assertThat(setCookieHeaders)
			.anySatisfy(cookie -> assertThat(cookie)
				.contains("cohi_access_token=new-access-token")
				.contains("HttpOnly"))
			.anySatisfy(cookie -> assertThat(cookie)
				.contains("cohi_refresh_token=new-refresh-token")
				.contains("HttpOnly"));
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

package com.coDevs.cohiChat.global.security.auth;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import jakarta.servlet.http.Cookie;

class AuthTokenResolverTest {

	private AuthTokenResolver authTokenResolver;

	@BeforeEach
	void setUp() {
		AuthProperties authProperties = new AuthProperties();
		authTokenResolver = new AuthTokenResolver(authProperties);
	}

	@Test
	@DisplayName("access token은 cookie를 Header보다 우선 사용한다")
	void resolveAccessToken_prefersCookie() {
		MockHttpServletRequest request = new MockHttpServletRequest();
		request.setCookies(new Cookie("cohi_access_token", "cookie-token"));
		request.addHeader("Authorization", "Bearer header-token");

		String token = authTokenResolver.resolveAccessToken(request);

		assertThat(token).isEqualTo("cookie-token");
	}

	@Test
	@DisplayName("access token cookie가 없으면 Bearer header로 fallback한다")
	void resolveAccessToken_fallsBackToHeader() {
		MockHttpServletRequest request = new MockHttpServletRequest();
		request.addHeader("Authorization", "Bearer header-token");

		String token = authTokenResolver.resolveAccessToken(request);

		assertThat(token).isEqualTo("header-token");
	}

	@Test
	@DisplayName("refresh token은 refresh cookie에서만 읽는다")
	void resolveRefreshToken_readsCookieOnly() {
		MockHttpServletRequest request = new MockHttpServletRequest();
		request.setCookies(new Cookie("cohi_refresh_token", "refresh-cookie-token"));

		String token = authTokenResolver.resolveRefreshToken(request);

		assertThat(token).isEqualTo("refresh-cookie-token");
	}
}

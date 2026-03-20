package com.coDevs.cohiChat.global.security.auth;

import java.time.Duration;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.coDevs.cohiChat.global.security.jwt.JwtTokenProvider;
import com.coDevs.cohiChat.member.response.LoginResponseDTO;
import com.coDevs.cohiChat.member.response.RefreshTokenResponseDTO;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class AuthCookieService {

	private final AuthProperties authProperties;
	private final JwtTokenProvider jwtTokenProvider;

	public void addLoginCookies(HttpServletResponse response, LoginResponseDTO loginResponse) {
		// 신규 발급 토큰이므로 설정값 기반 전체 만료 시간을 사용
		addTokenCookies(
			response,
			loginResponse.getAccessToken(),
			loginResponse.getRefreshToken(),
			Duration.ofMillis(jwtTokenProvider.getRefreshTokenExpirationMs())
		);
	}

	public void addRefreshCookies(HttpServletResponse response, RefreshTokenResponseDTO refreshResponse) {
		// refresh token은 기존 토큰 재사용이므로 남은 유효 시간을 그대로 반영
		long remainingSeconds = Math.max(jwtTokenProvider.getExpirationSeconds(refreshResponse.getRefreshToken()), 0);
		addTokenCookies(
			response,
			refreshResponse.getAccessToken(),
			refreshResponse.getRefreshToken(),
			Duration.ofSeconds(remainingSeconds)
		);
	}

	public void clearAuthCookies(HttpServletResponse response) {
		expireCookie(response, authProperties.getCookie().getAccessTokenName());
		expireCookie(response, authProperties.getCookie().getRefreshTokenName());
	}

	private void addTokenCookies(HttpServletResponse response, String accessToken, String refreshToken,
		Duration refreshMaxAge) {
		addCookie(response, authProperties.getCookie().getAccessTokenName(), accessToken,
			Duration.ofMillis(jwtTokenProvider.getAccessTokenExpirationMs()));
		addCookie(response, authProperties.getCookie().getRefreshTokenName(), refreshToken, refreshMaxAge);
	}

	private void addCookie(HttpServletResponse response, String name, String value, Duration maxAge) {
		if (!StringUtils.hasText(value)) {
			return;
		}
		response.addHeader(HttpHeaders.SET_COOKIE, createCookie(name, value, maxAge).toString());
	}

	private void expireCookie(HttpServletResponse response, String name) {
		response.addHeader(HttpHeaders.SET_COOKIE, createCookie(name, "", Duration.ZERO).toString());
	}

	private ResponseCookie createCookie(String name, String value, Duration maxAge) {
		return ResponseCookie.from(name, value)
			.httpOnly(true)
			.secure(authProperties.getCookie().isSecure())
			.sameSite(authProperties.getCookie().getSameSite().name())
			.path(authProperties.getCookie().getPath())
			.maxAge(maxAge)
			.build();
	}
}

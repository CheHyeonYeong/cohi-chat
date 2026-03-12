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
		addCookie(
			response,
			authProperties.getCookie().getAccessTokenName(),
			loginResponse.getAccessToken(),
			Duration.ofMillis(jwtTokenProvider.getAccessTokenExpirationMs())
		);
		addCookie(
			response,
			authProperties.getCookie().getRefreshTokenName(),
			loginResponse.getRefreshToken(),
			Duration.ofMillis(jwtTokenProvider.getRefreshTokenExpirationMs())
		);
	}

	public void addRefreshCookies(HttpServletResponse response, RefreshTokenResponseDTO refreshResponse) {
		addCookie(
			response,
			authProperties.getCookie().getAccessTokenName(),
			refreshResponse.getAccessToken(),
			Duration.ofMillis(jwtTokenProvider.getAccessTokenExpirationMs())
		);
		addCookie(
			response,
			authProperties.getCookie().getRefreshTokenName(),
			refreshResponse.getRefreshToken(),
			Duration.ofMillis(jwtTokenProvider.getRefreshTokenExpirationMs())
		);
	}

	public void clearAuthCookies(HttpServletResponse response) {
		expireCookie(response, authProperties.getCookie().getAccessTokenName());
		expireCookie(response, authProperties.getCookie().getRefreshTokenName());
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
			.sameSite(authProperties.getCookie().getSameSite())
			.path(authProperties.getCookie().getPath())
			.maxAge(maxAge)
			.build();
	}
}

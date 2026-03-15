package com.coDevs.cohiChat.global.security.auth;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.coDevs.cohiChat.global.util.TokenUtil;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class AuthTokenResolver {

	private final AuthProperties authProperties;

	/**
	 * 쿠키에서 access token을 먼저 읽고, 없으면 Authorization 헤더로 fallback한다.
	 * 헤더 fallback은 Swagger UI, Postman 등 비브라우저 클라이언트를 위해 유지한다.
	 */
	public String resolveAccessToken(HttpServletRequest request) {
		String accessToken = resolveCookieValue(request, authProperties.getCookie().getAccessTokenName());
		if (StringUtils.hasText(accessToken)) {
			return accessToken;
		}
		return TokenUtil.resolveToken(request);
	}

	public String resolveRefreshToken(HttpServletRequest request) {
		return resolveCookieValue(request, authProperties.getCookie().getRefreshTokenName());
	}

	private String resolveCookieValue(HttpServletRequest request, String cookieName) {
		Cookie[] cookies = request.getCookies();
		if (cookies == null) {
			return null;
		}
		for (Cookie cookie : cookies) {
			if (cookieName.equals(cookie.getName()) && StringUtils.hasText(cookie.getValue())) {
				return cookie.getValue();
			}
		}
		return null;
	}
}

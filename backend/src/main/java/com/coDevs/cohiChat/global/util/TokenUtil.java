package com.coDevs.cohiChat.global.util;

import org.springframework.util.StringUtils;

import jakarta.servlet.http.HttpServletRequest;

public final class TokenUtil {

	private static final String AUTH_HEADER = "Authorization";
	private static final String TOKEN_PREFIX = "Bearer ";

	private TokenUtil() {
	}

	public static String resolveToken(HttpServletRequest request) {
		String bearerToken = request.getHeader(AUTH_HEADER);
		if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(TOKEN_PREFIX)) {
			return bearerToken.substring(TOKEN_PREFIX.length());
		}
		return null;
	}
}

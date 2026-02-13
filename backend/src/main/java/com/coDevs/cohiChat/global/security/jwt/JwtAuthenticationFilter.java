package com.coDevs.cohiChat.global.security.jwt;

import java.io.IOException;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.coDevs.cohiChat.global.util.TokenHashUtil;
import com.coDevs.cohiChat.member.AccessTokenBlacklistRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private final JwtTokenProvider jwtTokenProvider;
	private final AccessTokenBlacklistRepository accessTokenBlacklistRepository;

	private static final String AUTH_HEADER = "Authorization";
	private static final String TOKEN_PREFIX = "Bearer ";

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
		throws ServletException, IOException {

		String token = resolveToken(request);

		if (token != null && jwtTokenProvider.validateToken(token)) {
			try {
				if (isBlacklisted(token)) {
					SecurityContextHolder.clearContext();
				} else {
					Authentication auth = jwtTokenProvider.getAuthentication(token);
					SecurityContextHolder.getContext().setAuthentication(auth);
				}
			} catch (Exception e) {
				log.warn("토큰 검증 중 오류 발생: {}", e.getMessage());
				SecurityContextHolder.clearContext();
			}
		}

		chain.doFilter(request, response);
	}

	private boolean isBlacklisted(String token) {
		String tokenHash = TokenHashUtil.hash(token);
		return accessTokenBlacklistRepository.existsById(tokenHash);
	}

	private String resolveToken(HttpServletRequest request) {
		String bearerToken = request.getHeader(AUTH_HEADER);
		if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(TOKEN_PREFIX)) {
			return bearerToken.substring(TOKEN_PREFIX.length());
		}
		return null;
	}
}

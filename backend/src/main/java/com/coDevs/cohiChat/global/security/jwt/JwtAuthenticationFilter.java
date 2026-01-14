package com.coDevs.cohiChat.global.security.jwt;

import java.io.IOException;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

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

	private static final String AUTH_HEADER = "Authorization";
	private static final String TOKEN_PREFIX = "Bearer ";

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
		throws ServletException, IOException {

		String requestURI = request.getRequestURI();
		String token = resolveToken(request);

		log.info("Incoming Request: {} | Token: {}", requestURI, (token != null ? "Found" : "Null"));

		if (token != null && jwtTokenProvider.validateToken(token)) {
			try {
				Authentication auth = jwtTokenProvider.getAuthentication(token);
				SecurityContextHolder.getContext().setAuthentication(auth);
				log.info("인증 성공: 유저명 = {}, 권한 = {}", auth.getName(), auth.getAuthorities());
			} catch (Exception e) {
				log.error("인증 실패 에러: {}", e.getMessage());
				SecurityContextHolder.clearContext();
			}
		} else if (token != null) {
			log.warn("토큰이 존재하지만 유효하지 않음 (validateToken 실패)");
		}

		chain.doFilter(request, response);
	}

	private String resolveToken(HttpServletRequest request) {
		String bearerToken = request.getHeader(AUTH_HEADER);
		if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(TOKEN_PREFIX)) {
			return bearerToken.substring(TOKEN_PREFIX.length());
		}
		return null;
	}
}

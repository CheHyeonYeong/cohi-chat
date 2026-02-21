package com.coDevs.cohiChat.global.security.jwt;

import java.io.IOException;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.coDevs.cohiChat.global.util.TokenHashUtil;
import com.coDevs.cohiChat.global.util.TokenUtil;
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

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
		throws ServletException, IOException {

		String token = TokenUtil.resolveToken(request);

		if (token != null && jwtTokenProvider.validateToken(token)) {
			try {
				if (isBlacklisted(token)) {
					SecurityContextHolder.clearContext();
				} else {
					Authentication auth = jwtTokenProvider.getAuthentication(token);
					SecurityContextHolder.getContext().setAuthentication(auth);
				}
			} catch (io.jsonwebtoken.JwtException e) {
				log.warn("JWT 토큰 파싱 오류: {}", e.getMessage());
				SecurityContextHolder.clearContext();
			} catch (org.springframework.dao.DataAccessException e) {
				log.error("Redis 연결 오류 (블랙리스트 확인 실패): {}", e.getMessage());
				SecurityContextHolder.clearContext();
			} catch (Exception e) {
				log.error("토큰 검증 중 예상치 못한 오류: {}", e.getMessage(), e);
				SecurityContextHolder.clearContext();
			}
		}

		chain.doFilter(request, response);
	}

	private boolean isBlacklisted(String token) {
		String tokenHash = TokenHashUtil.hash(token);
		return accessTokenBlacklistRepository.existsById(tokenHash);
	}
}

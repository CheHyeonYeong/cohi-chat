package com.coDevs.cohiChat.global.security.jwt;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

import java.util.Collections;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.coDevs.cohiChat.global.util.TokenHashUtil;
import com.coDevs.cohiChat.member.AccessTokenBlacklistRepository;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

	@Mock
	private JwtTokenProvider jwtTokenProvider;

	@Mock
	private AccessTokenBlacklistRepository accessTokenBlacklistRepository;

	private JwtAuthenticationFilter filter;

	@BeforeEach
	void setUp() {
		SecurityContextHolder.clearContext();
		filter = new JwtAuthenticationFilter(jwtTokenProvider, accessTokenBlacklistRepository);
	}

	@Test
	@DisplayName("정상 토큰: SecurityContext에 인증 설정")
	void validToken_setsAuthentication() throws Exception {
		MockHttpServletRequest request = new MockHttpServletRequest();
		request.addHeader("Authorization", "Bearer valid-token");
		MockFilterChain chain = new MockFilterChain();

		given(jwtTokenProvider.validateToken("valid-token")).willReturn(true);
		given(accessTokenBlacklistRepository.existsById(TokenHashUtil.hash("valid-token"))).willReturn(false);
		given(jwtTokenProvider.getAuthentication("valid-token"))
			.willReturn(new UsernamePasswordAuthenticationToken("user", null, Collections.emptyList()));

		filter.doFilterInternal(request, new MockHttpServletResponse(), chain);

		assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
		assertThat(SecurityContextHolder.getContext().getAuthentication().getName()).isEqualTo("user");
		assertThat(chain.getRequest()).isNotNull();
	}

	@Test
	@DisplayName("블랙리스트 토큰: SecurityContext 미설정")
	void blacklistedToken_doesNotSetAuthentication() throws Exception {
		MockHttpServletRequest request = new MockHttpServletRequest();
		request.addHeader("Authorization", "Bearer blacklisted-token");
		MockFilterChain chain = new MockFilterChain();

		given(jwtTokenProvider.validateToken("blacklisted-token")).willReturn(true);
		given(accessTokenBlacklistRepository.existsById(TokenHashUtil.hash("blacklisted-token"))).willReturn(true);

		filter.doFilterInternal(request, new MockHttpServletResponse(), chain);

		assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
		assertThat(chain.getRequest()).isNotNull();
	}

	@Test
	@DisplayName("토큰 없음: SecurityContext 미설정")
	void noToken_doesNotSetAuthentication() throws Exception {
		MockHttpServletRequest request = new MockHttpServletRequest();
		MockFilterChain chain = new MockFilterChain();

		filter.doFilterInternal(request, new MockHttpServletResponse(), chain);

		assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
		assertThat(chain.getRequest()).isNotNull();
	}

	@Test
	@DisplayName("유효하지 않은 토큰: SecurityContext 미설정")
	void invalidToken_doesNotSetAuthentication() throws Exception {
		MockHttpServletRequest request = new MockHttpServletRequest();
		request.addHeader("Authorization", "Bearer invalid-token");
		MockFilterChain chain = new MockFilterChain();

		given(jwtTokenProvider.validateToken("invalid-token")).willReturn(false);

		filter.doFilterInternal(request, new MockHttpServletResponse(), chain);

		assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
		assertThat(chain.getRequest()).isNotNull();
	}

	@Test
	@DisplayName("Redis 장애 시 fail-closed: SecurityContext 미설정")
	void redisFailure_clearsSecurityContext() throws Exception {
		MockHttpServletRequest request = new MockHttpServletRequest();
		request.addHeader("Authorization", "Bearer valid-token");
		MockFilterChain chain = new MockFilterChain();

		given(jwtTokenProvider.validateToken("valid-token")).willReturn(true);
		given(accessTokenBlacklistRepository.existsById(TokenHashUtil.hash("valid-token")))
			.willThrow(new DataAccessResourceFailureException("Redis connection refused"));

		filter.doFilterInternal(request, new MockHttpServletResponse(), chain);

		assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
		assertThat(chain.getRequest()).isNotNull();
	}
}

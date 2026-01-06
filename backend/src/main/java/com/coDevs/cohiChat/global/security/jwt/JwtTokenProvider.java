package com.coDevs.cohiChat.global.security.jwt;

import org.springframework.stereotype.Component;

@Component
public class JwtTokenProvider {

	// 1. 토큰 생성
	public String createToken(String username) {
		throw new UnsupportedOperationException("구현 예정");
	}

	// 2. 토큰 검증
	public boolean validateToken(String token) {
		throw new UnsupportedOperationException("구현 예정");
	}

	// 3. 토큰에서 사용자명 추출
	public String getUsernameFromToken(String token) {
		throw new UnsupportedOperationException("구현 예정");
	}

	// 4. 만료된 토큰 체크
	public boolean isTokenExpired(String token) {
		throw new UnsupportedOperationException("구현 예정");
	}

}

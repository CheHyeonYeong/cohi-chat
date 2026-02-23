package com.coDevs.cohiChat.global.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class TokenHashUtilTest {

	@Test
	void hash_sameInput_returnsSameOutput() {
		String token = "test-token";
		assertThat(TokenHashUtil.hash(token)).isEqualTo(TokenHashUtil.hash(token));
	}

	@Test
	void hash_differentInput_returnsDifferentOutput() {
		assertThat(TokenHashUtil.hash("token1")).isNotEqualTo(TokenHashUtil.hash("token2"));
	}

	@Test
	void hash_returns64CharHex() {
		String hash = TokenHashUtil.hash("any-token");
		assertThat(hash).hasSize(64);
		assertThat(hash).matches("[0-9a-f]+");
	}
}

package com.coDevs.cohiChat.global.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class NicknameGeneratorTest {

	private final NicknameGenerator nicknameGenerator = new NicknameGenerator();

	@Test
	@DisplayName("랜덤 닉네임이 정상적으로 생성되어야 한다")
	void generateNicknameTest() {
		// when
		String nickname = nicknameGenerator.generate();

		// then
		assertThat(nickname).isNotBlank();
		String[] parts = nickname.split(" ");
		assertThat(parts).hasSize(3); // 3단어 조합인지 확인
	}
}
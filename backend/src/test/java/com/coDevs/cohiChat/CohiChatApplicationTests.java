package com.coDevs.cohiChat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.coDevs.cohiChat.config.EmbeddedRedisConfig;

@SpringBootTest
@ActiveProfiles("test")
@Import(EmbeddedRedisConfig.class)
class CohiChatApplicationTests {

	@Test
	void contextLoads() {
	}

}

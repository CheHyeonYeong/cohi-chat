package com.coDevs.cohiChat.member;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.coDevs.cohiChat.config.EmbeddedRedisConfig;
import com.coDevs.cohiChat.member.entity.AccessTokenBlacklist;

@SpringBootTest
@ActiveProfiles("test")
@Import(EmbeddedRedisConfig.class)
class AccessTokenBlacklistRepositoryTest {

	@Autowired
	private AccessTokenBlacklistRepository accessTokenBlacklistRepository;

	private final String testTokenHash = "abc123hash";

	@AfterEach
	void tearDown() {
		accessTokenBlacklistRepository.deleteAll();
	}

	@Test
	@DisplayName("성공: blacklist 저장 및 ID(tokenHash)로 조회")
	void saveAndFindById() {
		// given
		AccessTokenBlacklist blacklist = AccessTokenBlacklist.create(testTokenHash, 3600L);
		accessTokenBlacklistRepository.save(blacklist);

		// when
		Optional<AccessTokenBlacklist> found = accessTokenBlacklistRepository.findById(testTokenHash);

		// then
		assertThat(found).isPresent();
		assertThat(found.get().getTokenHash()).isEqualTo(testTokenHash);
	}

	@Test
	@DisplayName("성공: 존재하지 않는 tokenHash 조회 시 빈 Optional 반환")
	void findByIdNotFound() {
		// when
		Optional<AccessTokenBlacklist> found = accessTokenBlacklistRepository.findById("non-existent");

		// then
		assertThat(found).isEmpty();
	}

	@Test
	@DisplayName("성공: existsById로 blacklist 존재 여부 확인")
	void existsById() {
		// given
		AccessTokenBlacklist blacklist = AccessTokenBlacklist.create(testTokenHash, 3600L);
		accessTokenBlacklistRepository.save(blacklist);

		// when & then
		assertThat(accessTokenBlacklistRepository.existsById(testTokenHash)).isTrue();
		assertThat(accessTokenBlacklistRepository.existsById("non-existent")).isFalse();
	}

	@Test
	@DisplayName("성공: blacklist 삭제")
	void deleteById() {
		// given
		AccessTokenBlacklist blacklist = AccessTokenBlacklist.create(testTokenHash, 3600L);
		accessTokenBlacklistRepository.save(blacklist);

		// when
		accessTokenBlacklistRepository.deleteById(testTokenHash);

		// then
		assertThat(accessTokenBlacklistRepository.findById(testTokenHash)).isEmpty();
	}
}

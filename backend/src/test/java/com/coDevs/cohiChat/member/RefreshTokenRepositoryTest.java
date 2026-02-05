package com.coDevs.cohiChat.member;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.coDevs.cohiChat.config.EmbeddedRedisConfig;
import com.coDevs.cohiChat.member.entity.RefreshToken;

@SpringBootTest
@ActiveProfiles("test")
@Import(EmbeddedRedisConfig.class)
class RefreshTokenRepositoryTest {

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    private final String testUsername = "testuser";
    private final String testToken = "test-refresh-token-value";

    @BeforeEach
    void setUp() {
        RefreshToken refreshToken = RefreshToken.create(
            testToken,
            testUsername,
            604800000L // 7 days
        );
        refreshTokenRepository.save(refreshToken);
    }

    @AfterEach
    void tearDown() {
        refreshTokenRepository.deleteAll();
    }

    @Test
    @DisplayName("성공: RefreshToken 저장 및 ID(username)로 조회")
    void saveAndFindById() {
        // when
        Optional<RefreshToken> found = refreshTokenRepository.findById(testUsername);

        // then
        assertThat(found).isPresent();
        assertThat(found.get().getToken()).isEqualTo(testToken);
        assertThat(found.get().getUsername()).isEqualTo(testUsername);
    }

    @Test
    @DisplayName("성공: 토큰 값으로 조회")
    void findByToken() {
        // when
        Optional<RefreshToken> found = refreshTokenRepository.findByToken(testToken);

        // then
        assertThat(found).isPresent();
        assertThat(found.get().getUsername()).isEqualTo(testUsername);
    }

    @Test
    @DisplayName("성공: 존재하지 않는 토큰 조회 시 빈 Optional 반환")
    void findByTokenNotFound() {
        // when
        Optional<RefreshToken> found = refreshTokenRepository.findByToken("non-existent-token");

        // then
        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("성공: ID(username)로 토큰 삭제")
    void deleteById() {
        // when
        refreshTokenRepository.deleteById(testUsername);

        // then
        Optional<RefreshToken> found = refreshTokenRepository.findById(testUsername);
        assertThat(found).isEmpty();
    }
}

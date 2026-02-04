package com.coDevs.cohiChat.member;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import com.coDevs.cohiChat.member.entity.RefreshToken;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class RefreshTokenRepositoryTest {

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    private RefreshToken savedToken;
    private final String testUsername = "testuser";
    private final String testToken = "test-refresh-token-value";

    @BeforeEach
    void setUp() {
        RefreshToken refreshToken = RefreshToken.create(
            testToken,
            testUsername,
            LocalDateTime.now().plusDays(7)
        );
        savedToken = refreshTokenRepository.save(refreshToken);
    }

    @Test
    @DisplayName("성공: RefreshToken 저장 및 조회")
    void saveAndFindRefreshToken() {
        // when
        Optional<RefreshToken> found = refreshTokenRepository.findById(savedToken.getId());

        // then
        assertThat(found).isPresent();
        assertThat(found.get().getToken()).isEqualTo(testToken);
        assertThat(found.get().getUsername()).isEqualTo(testUsername);
        assertThat(found.get().getExpiresAt()).isAfter(LocalDateTime.now());
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
    @DisplayName("성공: username으로 토큰 삭제")
    void deleteByUsername() {
        // when
        refreshTokenRepository.deleteByUsername(testUsername);

        // then
        Optional<RefreshToken> found = refreshTokenRepository.findByToken(testToken);
        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("성공: username으로 토큰 조회")
    void findByUsername() {
        // when
        Optional<RefreshToken> found = refreshTokenRepository.findByUsername(testUsername);

        // then
        assertThat(found).isPresent();
        assertThat(found.get().getToken()).isEqualTo(testToken);
    }
}

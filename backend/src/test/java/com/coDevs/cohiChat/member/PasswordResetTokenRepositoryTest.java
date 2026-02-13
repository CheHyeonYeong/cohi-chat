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
import com.coDevs.cohiChat.member.entity.PasswordResetToken;

@SpringBootTest
@ActiveProfiles("test")
@Import(EmbeddedRedisConfig.class)
class PasswordResetTokenRepositoryTest {

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    private final String testToken = "test-reset-token-uuid";
    private final String testEmail = "user@example.com";

    @BeforeEach
    void setUp() {
        PasswordResetToken token = PasswordResetToken.create(
            testToken,
            testEmail,
            1800000L // 30 minutes
        );
        passwordResetTokenRepository.save(token);
    }

    @AfterEach
    void tearDown() {
        passwordResetTokenRepository.deleteAll();
    }

    @Test
    @DisplayName("성공: PasswordResetToken 저장 및 토큰으로 조회")
    void saveAndFindByToken() {
        // when
        Optional<PasswordResetToken> found = passwordResetTokenRepository.findById(testToken);

        // then
        assertThat(found).isPresent();
        assertThat(found.get().getToken()).isEqualTo(testToken);
        assertThat(found.get().getEmail()).isEqualTo(testEmail);
    }

    @Test
    @DisplayName("성공: 이메일로 토큰 조회")
    void findByEmail() {
        // when
        Optional<PasswordResetToken> found = passwordResetTokenRepository.findByEmail(testEmail);

        // then
        assertThat(found).isPresent();
        assertThat(found.get().getToken()).isEqualTo(testToken);
    }

    @Test
    @DisplayName("성공: 존재하지 않는 토큰 조회 시 빈 Optional 반환")
    void findByTokenNotFound() {
        // when
        Optional<PasswordResetToken> found = passwordResetTokenRepository.findById("non-existent-token");

        // then
        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("성공: 토큰 삭제")
    void deleteByToken() {
        // when
        passwordResetTokenRepository.deleteById(testToken);

        // then
        Optional<PasswordResetToken> found = passwordResetTokenRepository.findById(testToken);
        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("성공: 이메일로 조회 후 토큰 삭제")
    void deleteByEmailUsingFindAndDelete() {
        // given
        Optional<PasswordResetToken> found = passwordResetTokenRepository.findByEmail(testEmail);
        assertThat(found).isPresent();

        // when - email로 찾은 후 token ID로 삭제
        passwordResetTokenRepository.deleteById(found.get().getToken());

        // then
        Optional<PasswordResetToken> afterDelete = passwordResetTokenRepository.findByEmail(testEmail);
        assertThat(afterDelete).isEmpty();
    }
}

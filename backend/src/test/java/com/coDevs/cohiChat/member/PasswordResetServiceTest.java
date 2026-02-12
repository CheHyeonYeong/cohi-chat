package com.coDevs.cohiChat.member;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.coDevs.cohiChat.email.EmailService;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.PasswordResetToken;
import com.coDevs.cohiChat.member.entity.Role;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    private PasswordResetService passwordResetService;

    private static final String BASE_URL = "http://localhost:3000";
    private static final long TOKEN_EXPIRATION_MINUTES = 30;

    @BeforeEach
    void setUp() {
        passwordResetService = new PasswordResetService(
            memberRepository,
            passwordResetTokenRepository,
            passwordEncoder,
            emailService,
            BASE_URL,
            TOKEN_EXPIRATION_MINUTES
        );
    }

    @Nested
    @DisplayName("비밀번호 재설정 요청")
    class RequestPasswordReset {

        @Test
        @DisplayName("성공: 존재하는 이메일로 재설정 요청 시 토큰 생성 및 이메일 발송")
        void requestPasswordReset_success() {
            // given
            String email = "user@example.com";
            Member member = createMember(email);
            when(memberRepository.findByEmailAndIsDeletedFalse(email)).thenReturn(Optional.of(member));
            when(passwordResetTokenRepository.findByEmail(email)).thenReturn(Optional.empty());

            // when
            passwordResetService.requestPasswordReset(email);

            // then
            ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
            verify(passwordResetTokenRepository).save(tokenCaptor.capture());

            PasswordResetToken savedToken = tokenCaptor.getValue();
            assertThat(savedToken.getEmail()).isEqualTo(email);
            assertThat(savedToken.getToken()).isNotBlank();

            verify(emailService).sendPasswordResetEmail(
                eq(email),
                contains(savedToken.getToken())
            );
        }

        @Test
        @DisplayName("성공: 존재하지 않는 이메일로 요청해도 예외 없이 조용히 종료 (보안)")
        void requestPasswordReset_emailNotFound_silentlyIgnore() {
            // given
            String email = "nonexistent@example.com";
            when(memberRepository.findByEmailAndIsDeletedFalse(email)).thenReturn(Optional.empty());

            // when & then - should not throw
            passwordResetService.requestPasswordReset(email);

            verify(passwordResetTokenRepository, never()).save(any());
            verify(emailService, never()).sendPasswordResetEmail(any(), any());
        }

        @Test
        @DisplayName("성공: 기존 토큰이 있으면 삭제 후 새 토큰 생성")
        void requestPasswordReset_existingToken_replacesOldToken() {
            // given
            String email = "user@example.com";
            Member member = createMember(email);
            PasswordResetToken existingToken = PasswordResetToken.create("old-token", email, 1800000L);

            when(memberRepository.findByEmailAndIsDeletedFalse(email)).thenReturn(Optional.of(member));
            when(passwordResetTokenRepository.findByEmail(email)).thenReturn(Optional.of(existingToken));

            // when
            passwordResetService.requestPasswordReset(email);

            // then
            verify(passwordResetTokenRepository).deleteById("old-token");
            verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
        }
    }

    @Nested
    @DisplayName("비밀번호 재설정 확인")
    class ResetPassword {

        @Test
        @DisplayName("성공: 유효한 토큰으로 비밀번호 변경")
        void resetPassword_success() {
            // given
            String token = UUID.randomUUID().toString();
            String email = "user@example.com";
            String newPassword = "newPassword123!";
            String encodedPassword = "encoded_password";

            PasswordResetToken resetToken = PasswordResetToken.create(token, email, 1800000L);
            Member member = createMember(email);

            when(passwordResetTokenRepository.findById(token)).thenReturn(Optional.of(resetToken));
            when(memberRepository.findByEmailAndIsDeletedFalse(email)).thenReturn(Optional.of(member));
            when(passwordEncoder.encode(newPassword)).thenReturn(encodedPassword);

            // when
            passwordResetService.resetPassword(token, newPassword);

            // then
            verify(passwordEncoder).encode(newPassword);
            verify(passwordResetTokenRepository).deleteById(token);
        }

        @Test
        @DisplayName("실패: 존재하지 않는 토큰으로 요청")
        void resetPassword_invalidToken_throwsException() {
            // given
            String token = "invalid-token";
            String newPassword = "newPassword123!";

            when(passwordResetTokenRepository.findById(token)).thenReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> passwordResetService.resetPassword(token, newPassword))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_RESET_TOKEN);
        }

        @Test
        @DisplayName("실패: 토큰에 연결된 사용자가 없음")
        void resetPassword_userNotFound_throwsException() {
            // given
            String token = UUID.randomUUID().toString();
            String email = "deleted@example.com";
            String newPassword = "newPassword123!";

            PasswordResetToken resetToken = PasswordResetToken.create(token, email, 1800000L);

            when(passwordResetTokenRepository.findById(token)).thenReturn(Optional.of(resetToken));
            when(memberRepository.findByEmailAndIsDeletedFalse(email)).thenReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> passwordResetService.resetPassword(token, newPassword))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getErrorCode())
                .isEqualTo(ErrorCode.USER_NOT_FOUND);
        }
    }

    private Member createMember(String email) {
        return Member.create(
            "testuser",
            "Test User",
            email,
            "hashedPassword",
            Role.GUEST
        );
    }
}

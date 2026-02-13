package com.coDevs.cohiChat.email;

import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private MimeMessage mimeMessage;

    private EmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailServiceImpl(mailSender, "noreply@cohichat.com");
    }

    @Test
    @DisplayName("비밀번호 재설정 이메일을 전송한다")
    void sendPasswordResetEmail() {
        // given
        String to = "user@example.com";
        String resetLink = "http://localhost:3000/password-reset/confirm?token=abc123";
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        // when
        emailService.sendPasswordResetEmail(to, resetLink);

        // then
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("이메일 전송 실패 시 예외를 던지지 않고 로그만 남긴다")
    void sendPasswordResetEmail_failure_logsError() {
        // given
        String to = "user@example.com";
        String resetLink = "http://localhost:3000/password-reset/confirm?token=abc123";
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new RuntimeException("SMTP error")).when(mailSender).send(any(MimeMessage.class));

        // when & then - should not throw
        emailService.sendPasswordResetEmail(to, resetLink);
    }
}

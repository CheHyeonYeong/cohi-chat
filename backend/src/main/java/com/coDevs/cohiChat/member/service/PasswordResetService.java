package com.coDevs.cohiChat.member.service;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.global.service.EmailService;
import com.coDevs.cohiChat.member.MemberRepository;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.PasswordResetToken;
import com.coDevs.cohiChat.member.repository.PasswordResetTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.util.HtmlUtils;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final MemberRepository memberRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.password-reset.token-expiry-minutes:3}")
    private int tokenExpiryMinutes;

    @Value("${app.password-reset.base-url:http://localhost:3000}")
    private String baseUrl;

    public void requestPasswordReset(String email) {
        // Always return success for security (don't reveal if email exists)
        memberRepository.findByEmailAndIsDeletedFalse(email).ifPresent(member -> {
            // 기존 토큰 무효화
            tokenRepository.findByEmail(email).ifPresent(tokenRepository::delete);

            String token = UUID.randomUUID().toString();
            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .token(token)
                    .email(email)
                    .expiration((long) tokenExpiryMinutes)
                    .build();
            tokenRepository.save(resetToken);

            String resetLink = baseUrl + "/reset-password?token=" + token;
            String htmlContent = buildPasswordResetEmail(member.getDisplayName(), resetLink);
            emailService.sendHtmlEmail(email, "[cohiChat] 비밀번호 재설정", htmlContent);
        });
    }

    public boolean verifyToken(String token) {
        return tokenRepository.findById(token).isPresent();
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findById(token)
                .orElseThrow(() -> new CustomException(ErrorCode.INVALID_TOKEN));

        Member member = memberRepository.findByEmailAndIsDeletedFalse(resetToken.getEmail())
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        member.updatePassword(passwordEncoder.encode(newPassword));
        tokenRepository.delete(resetToken);
    }

    private String buildPasswordResetEmail(String displayName, String resetLink) {
        try (InputStream is = getClass().getResourceAsStream("/templates/password-reset.html")) {
            if (is == null) {
                throw new RuntimeException("이메일 템플릿을 찾을 수 없습니다: /templates/password-reset.html");
            }
            String template = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            return template
                    .replace("{{baseUrl}}", baseUrl)
                    .replace("{{displayName}}", HtmlUtils.htmlEscape(displayName))
                    .replace("{{resetLink}}", resetLink);
        } catch (IOException e) {
            throw new RuntimeException("이메일 템플릿 로드 실패", e);
        }
    }
}

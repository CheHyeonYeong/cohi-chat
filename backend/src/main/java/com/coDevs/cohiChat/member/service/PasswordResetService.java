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

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final MemberRepository memberRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.password-reset.token-expiry-minutes:30}")
    private int tokenExpiryMinutes;

    @Value("${app.password-reset.base-url:http://localhost:3000}")
    private String baseUrl;

    public void requestPasswordReset(String email) {
        // Always return success for security (don't reveal if email exists)
        memberRepository.findByEmailAndIsDeletedFalse(email).ifPresent(member -> {
            String token = UUID.randomUUID().toString();
            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .token(token)
                    .email(email)
                    .expiresAt(LocalDateTime.now().plusMinutes(tokenExpiryMinutes))
                    .build();
            tokenRepository.save(resetToken);

            String resetLink = baseUrl + "/reset-password?token=" + token;
            String htmlContent = buildPasswordResetEmail(member.getDisplayName(), resetLink);
            emailService.sendHtmlEmail(email, "[coheChat] 비밀번호 재설정", htmlContent);
        });
    }

    @Transactional(readOnly = true)
    public boolean verifyToken(String token) {
        return tokenRepository.findByTokenAndUsedFalse(token)
                .map(t -> !t.isExpired())
                .orElse(false);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByTokenAndUsedFalse(token)
                .orElseThrow(() -> new CustomException(ErrorCode.INVALID_TOKEN));

        if (resetToken.isExpired()) {
            throw new CustomException(ErrorCode.EXPIRED_TOKEN);
        }

        Member member = memberRepository.findByEmailAndIsDeletedFalse(resetToken.getEmail())
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        member.updatePassword(passwordEncoder.encode(newPassword));
        resetToken.markUsed();
    }

    private String buildPasswordResetEmail(String displayName, String resetLink) {
        return """
                <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #8B6914; font-size: 24px;">coheChat</h1>
                    </div>
                    <div style="background: #F5F0E8; border-radius: 16px; padding: 32px;">
                        <h2 style="color: #3D3D3D; margin-bottom: 16px;">비밀번호 재설정</h2>
                        <p style="color: #3D3D3D; line-height: 1.6;">
                            안녕하세요, %s님.<br/>
                            아래 버튼을 클릭하여 비밀번호를 재설정해주세요.
                        </p>
                        <div style="text-align: center; margin: 24px 0;">
                            <a href="%s" style="display: inline-block; background: #8B6914; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                                비밀번호 재설정
                            </a>
                        </div>
                        <p style="color: #999; font-size: 12px; margin-top: 24px;">
                            이 링크는 30분간 유효합니다.<br/>
                            본인이 요청하지 않은 경우 이 이메일을 무시해주세요.
                        </p>
                    </div>
                </div>
                """.formatted(displayName, resetLink);
    }
}

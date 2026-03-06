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
            emailService.sendHtmlEmail(email, "[cohiChat] 비밀번호 재설정", htmlContent);
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
                        <a href="%s" style="text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="#A67C52" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2 21V19H20V21H2ZM4 18C3.45 18 2.979 17.804 2.587 17.412C2.195 17.02 1.99933 16.5493 2 16V5H18V9H20C20.55 9 21.021 9.196 21.413 9.588C21.805 9.98 22.0007 10.4507 22 11V14C22 14.55 21.804 15.021 21.412 15.413C21.02 15.805 20.5493 16.0007 20 16H18V18H4ZM18 14H20V11H18V14ZM4 16H16V7H4V16Z"/>
                                <path d="M7 4C7 3.5 7.5 2 9 2C10.5 2 11 3.5 11 4" stroke="#A67C52" stroke-width="1.5" fill="none" stroke-linecap="round"/>
                            </svg>
                            <span style="font-size: 24px; font-weight: bold; color: #8B6914;">cohiChat</span>
                        </a>
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
                """.formatted(baseUrl, displayName, resetLink);
    }
}

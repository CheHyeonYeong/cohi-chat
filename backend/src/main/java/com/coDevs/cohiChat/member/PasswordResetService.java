package com.coDevs.cohiChat.member;

import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.email.EmailService;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.PasswordResetToken;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class PasswordResetService {

    private final MemberRepository memberRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final String baseUrl;
    private final long tokenExpirationMinutes;

    public PasswordResetService(
            MemberRepository memberRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            @Value("${password-reset.base-url}") String baseUrl,
            @Value("${password-reset.token-expiration-minutes}") long tokenExpirationMinutes) {
        this.memberRepository = memberRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.baseUrl = baseUrl;
        this.tokenExpirationMinutes = tokenExpirationMinutes;
    }

    public void requestPasswordReset(String email) {
        // 보안: 이메일 존재 여부와 관계없이 동일한 응답 반환
        Optional<Member> memberOpt = memberRepository.findByEmailAndIsDeletedFalse(email.toLowerCase());

        if (memberOpt.isEmpty()) {
            log.debug("Password reset requested for non-existent email: {}", email);
            return;
        }

        // 기존 토큰이 있으면 삭제
        passwordResetTokenRepository.findByEmail(email.toLowerCase())
            .ifPresent(existingToken -> passwordResetTokenRepository.deleteById(existingToken.getToken()));

        // 새 토큰 생성
        String token = UUID.randomUUID().toString();
        long expirationMs = tokenExpirationMinutes * 60 * 1000;

        PasswordResetToken resetToken = PasswordResetToken.create(
            token,
            email.toLowerCase(),
            expirationMs
        );
        passwordResetTokenRepository.save(resetToken);

        // 이메일 발송
        String resetLink = baseUrl + "/password-reset/confirm?token=" + token;
        emailService.sendPasswordResetEmail(email, resetLink);

        log.info("Password reset email sent for: {}", email);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findById(token)
            .orElseThrow(() -> new CustomException(ErrorCode.INVALID_RESET_TOKEN));

        Member member = memberRepository.findByEmailAndIsDeletedFalse(resetToken.getEmail())
            .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 비밀번호 변경
        String encodedPassword = passwordEncoder.encode(newPassword);
        member.updateInfo(null, encodedPassword);

        // 토큰 삭제
        passwordResetTokenRepository.deleteById(token);

        log.info("Password reset completed for user: {}", member.getUsername());
    }
}

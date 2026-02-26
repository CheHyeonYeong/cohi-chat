package com.coDevs.cohiChat.member;

import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.global.common.email.EmailService;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.global.util.TokenHashUtil;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.PasswordResetToken;
import com.coDevs.cohiChat.member.entity.Provider;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

	private final MemberRepository memberRepository;
	private final PasswordResetTokenRepository passwordResetTokenRepository;
	private final EmailService emailService;
	private final PasswordEncoder passwordEncoder;

	@Value("${password-reset.base-url:http://localhost:3000}")
	private String baseUrl;

	/**
	 * 비밀번호 재설정 이메일 발송.
	 * 이메일 미존재 여부를 외부에 노출하지 않아 사용자 열거 공격을 방지한다.
	 */
	public void requestPasswordReset(String email) {
		Optional<Member> memberOpt = memberRepository.findByEmailAndIsDeletedFalse(email);

		if (memberOpt.isEmpty()) {
			log.debug("비밀번호 재설정 요청: 존재하지 않는 이메일 (무시) email={}", email);
			return;
		}

		Member member = memberOpt.get();
		if (member.getProvider() != Provider.LOCAL) {
			throw new CustomException(ErrorCode.PASSWORD_RESET_NOT_LOCAL);
		}

		String rawToken = UUID.randomUUID().toString();
		String tokenHash = TokenHashUtil.hash(rawToken);

		String resetLink = baseUrl + "/password-reset/confirm?token=" + rawToken;
		emailService.sendPasswordResetEmail(email, resetLink);
		passwordResetTokenRepository.save(PasswordResetToken.create(email, tokenHash));

		log.info("비밀번호 재설정 이메일 발송 완료: email={}", email);
	}

	/**
	 * 토큰 유효성 검증.
	 */
	public void verifyResetToken(String rawToken) {
		String tokenHash = TokenHashUtil.hash(rawToken);
		passwordResetTokenRepository.findByTokenHash(tokenHash)
			.orElseThrow(() -> new CustomException(ErrorCode.INVALID_RESET_TOKEN));
	}

	/**
	 * 새 비밀번호로 변경 후 토큰 삭제.
	 */
	@Transactional
	public void confirmPasswordReset(String rawToken, String newPassword) {
		String tokenHash = TokenHashUtil.hash(rawToken);
		PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
			.orElseThrow(() -> new CustomException(ErrorCode.INVALID_RESET_TOKEN));

		Member member = memberRepository.findByEmailAndIsDeletedFalse(resetToken.getEmail())
			.orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

		if (passwordEncoder.matches(newPassword, member.getHashedPassword())) {
			throw new CustomException(ErrorCode.SAME_PASSWORD_NOT_ALLOWED);
		}

		member.resetPassword(passwordEncoder.encode(newPassword));
		passwordResetTokenRepository.deleteById(resetToken.getEmail());

		log.info("비밀번호 재설정 완료: email={}", resetToken.getEmail());
	}
}

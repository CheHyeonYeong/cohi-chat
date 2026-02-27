package com.coDevs.cohiChat.member.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.global.service.EmailService;
import com.coDevs.cohiChat.member.MemberRepository;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.PasswordResetToken;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.member.repository.PasswordResetTokenRepository;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

	private static final String TEST_EMAIL = "test@test.com";
	private static final String TEST_DISPLAY_NAME = "testUser";
	private static final String TEST_TOKEN = "test-reset-token";
	private static final String TEST_NEW_PASSWORD = "newPassword1!";

	@Mock
	private MemberRepository memberRepository;

	@Mock
	private PasswordResetTokenRepository tokenRepository;

	@Mock
	private EmailService emailService;

	@Mock
	private PasswordEncoder passwordEncoder;

	@InjectMocks
	private PasswordResetService passwordResetService;

	@BeforeEach
	void setUp() {
		ReflectionTestUtils.setField(passwordResetService, "tokenExpiryMinutes", 30);
		ReflectionTestUtils.setField(passwordResetService, "baseUrl", "http://localhost:3000");
	}

	@Test
	@DisplayName("성공: 가입된 이메일로 비밀번호 재설정 요청 시 토큰 생성 및 이메일 발송")
	void requestPasswordReset_registeredEmail_createsTokenAndSendsEmail() {
		// given
		Member member = Member.create("testuser", TEST_DISPLAY_NAME, TEST_EMAIL, "hashedPassword", Role.GUEST);
		given(memberRepository.findByEmailAndIsDeletedFalse(TEST_EMAIL)).willReturn(Optional.of(member));

		// when
		passwordResetService.requestPasswordReset(TEST_EMAIL);

		// then
		ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
		verify(tokenRepository).save(tokenCaptor.capture());
		PasswordResetToken savedToken = tokenCaptor.getValue();
		assertThat(savedToken.getEmail()).isEqualTo(TEST_EMAIL);
		assertThat(savedToken.getToken()).isNotBlank();
		assertThat(savedToken.getExpiresAt()).isAfter(LocalDateTime.now());

		verify(emailService).sendHtmlEmail(eq(TEST_EMAIL), eq("[coheChat] 비밀번호 재설정"), anyString());
	}

	@Test
	@DisplayName("성공: 미가입 이메일로 비밀번호 재설정 요청 시 예외 없이 정상 종료 (이메일 열거 방지)")
	void requestPasswordReset_unregisteredEmail_completesWithoutException() {
		// given
		given(memberRepository.findByEmailAndIsDeletedFalse("unknown@test.com")).willReturn(Optional.empty());

		// when
		passwordResetService.requestPasswordReset("unknown@test.com");

		// then
		verify(tokenRepository, never()).save(any(PasswordResetToken.class));
		verify(emailService, never()).sendHtmlEmail(anyString(), anyString(), anyString());
	}

	@Test
	@DisplayName("성공: 유효한 토큰 검증 시 true 반환")
	void verifyToken_validToken_returnsTrue() {
		// given
		PasswordResetToken token = PasswordResetToken.builder()
			.token(TEST_TOKEN)
			.email(TEST_EMAIL)
			.expiresAt(LocalDateTime.now().plusMinutes(30))
			.build();
		given(tokenRepository.findByTokenAndUsedFalse(TEST_TOKEN)).willReturn(Optional.of(token));

		// when
		boolean result = passwordResetService.verifyToken(TEST_TOKEN);

		// then
		assertThat(result).isTrue();
	}

	@Test
	@DisplayName("실패: 만료된 토큰 검증 시 false 반환")
	void verifyToken_expiredToken_returnsFalse() {
		// given
		PasswordResetToken token = PasswordResetToken.builder()
			.token(TEST_TOKEN)
			.email(TEST_EMAIL)
			.expiresAt(LocalDateTime.now().minusMinutes(1))
			.build();
		given(tokenRepository.findByTokenAndUsedFalse(TEST_TOKEN)).willReturn(Optional.of(token));

		// when
		boolean result = passwordResetService.verifyToken(TEST_TOKEN);

		// then
		assertThat(result).isFalse();
	}

	@Test
	@DisplayName("실패: 이미 사용된 토큰 검증 시 false 반환")
	void verifyToken_usedToken_returnsFalse() {
		// given — findByTokenAndUsedFalse 는 used=true 인 토큰을 반환하지 않음
		given(tokenRepository.findByTokenAndUsedFalse(TEST_TOKEN)).willReturn(Optional.empty());

		// when
		boolean result = passwordResetService.verifyToken(TEST_TOKEN);

		// then
		assertThat(result).isFalse();
	}

	@Test
	@DisplayName("실패: 존재하지 않는 토큰 검증 시 false 반환")
	void verifyToken_nonExistentToken_returnsFalse() {
		// given
		given(tokenRepository.findByTokenAndUsedFalse("non-existent-token")).willReturn(Optional.empty());

		// when
		boolean result = passwordResetService.verifyToken("non-existent-token");

		// then
		assertThat(result).isFalse();
	}

	@Test
	@DisplayName("성공: 유효한 토큰으로 비밀번호 재설정 시 비밀번호 변경 및 토큰 사용 처리")
	void resetPassword_validToken_changesPasswordAndMarksTokenUsed() {
		// given
		PasswordResetToken resetToken = PasswordResetToken.builder()
			.token(TEST_TOKEN)
			.email(TEST_EMAIL)
			.expiresAt(LocalDateTime.now().plusMinutes(30))
			.build();
		Member member = Member.create("testuser", TEST_DISPLAY_NAME, TEST_EMAIL, "oldHashedPassword", Role.GUEST);

		given(tokenRepository.findByTokenAndUsedFalse(TEST_TOKEN)).willReturn(Optional.of(resetToken));
		given(memberRepository.findByEmailAndIsDeletedFalse(TEST_EMAIL)).willReturn(Optional.of(member));
		given(passwordEncoder.encode(TEST_NEW_PASSWORD)).willReturn("newHashedPassword");

		// when
		passwordResetService.resetPassword(TEST_TOKEN, TEST_NEW_PASSWORD);

		// then
		assertThat(member.getHashedPassword()).isEqualTo("newHashedPassword");
		assertThat(resetToken.isUsed()).isTrue();
	}

	@Test
	@DisplayName("실패: 만료된 토큰으로 비밀번호 재설정 시 EXPIRED_TOKEN 예외")
	void resetPassword_expiredToken_throwsExpiredTokenException() {
		// given
		PasswordResetToken resetToken = PasswordResetToken.builder()
			.token(TEST_TOKEN)
			.email(TEST_EMAIL)
			.expiresAt(LocalDateTime.now().minusMinutes(1))
			.build();
		given(tokenRepository.findByTokenAndUsedFalse(TEST_TOKEN)).willReturn(Optional.of(resetToken));

		// when & then
		assertThatThrownBy(() -> passwordResetService.resetPassword(TEST_TOKEN, TEST_NEW_PASSWORD))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.EXPIRED_TOKEN);
	}

	@Test
	@DisplayName("실패: 존재하지 않는 토큰으로 비밀번호 재설정 시 INVALID_TOKEN 예외")
	void resetPassword_nonExistentToken_throwsInvalidTokenException() {
		// given
		given(tokenRepository.findByTokenAndUsedFalse("non-existent-token")).willReturn(Optional.empty());

		// when & then
		assertThatThrownBy(() -> passwordResetService.resetPassword("non-existent-token", TEST_NEW_PASSWORD))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_TOKEN);
	}
}

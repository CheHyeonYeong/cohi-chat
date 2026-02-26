package com.coDevs.cohiChat.member;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.coDevs.cohiChat.global.common.email.EmailService;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.PasswordResetToken;
import com.coDevs.cohiChat.member.entity.Provider;
import com.coDevs.cohiChat.member.entity.Role;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

	@Mock
	private MemberRepository memberRepository;

	@Mock
	private PasswordResetTokenRepository passwordResetTokenRepository;

	@Mock
	private EmailService emailService;

	@Mock
	private PasswordEncoder passwordEncoder;

	@InjectMocks
	private PasswordResetService passwordResetService;

	private static final String TEST_EMAIL = "test@test.com";
	private static final String TEST_USERNAME = "testuser";
	private static final String BASE_URL = "http://localhost:3000";

	private Member localMember;
	private Member oauthMember;

	@BeforeEach
	void setUp() {
		ReflectionTestUtils.setField(passwordResetService, "baseUrl", BASE_URL);
		localMember = Member.create(TEST_USERNAME, "닉네임", TEST_EMAIL, "hashedPw", Role.GUEST);
		oauthMember = Member.createOAuth("oauth_user", "닉네임", TEST_EMAIL,
			"provider_id_123", Provider.GOOGLE, Role.GUEST);
	}

	@Test
	@DisplayName("성공: 이메일로 비밀번호 재설정 링크 발송")
	void requestPasswordReset_success() {
		given(memberRepository.findByEmailAndIsDeletedFalse(TEST_EMAIL)).willReturn(Optional.of(localMember));

		passwordResetService.requestPasswordReset(TEST_EMAIL);

		verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
		verify(emailService).sendPasswordResetEmail(eq(TEST_EMAIL), contains("/password-reset/confirm?token="));
	}

	@Test
	@DisplayName("성공: 존재하지 않는 이메일도 동일한 응답 (사용자 열거 방지)")
	void requestPasswordReset_emailNotFound_silentlyIgnored() {
		given(memberRepository.findByEmailAndIsDeletedFalse(TEST_EMAIL)).willReturn(Optional.empty());

		passwordResetService.requestPasswordReset(TEST_EMAIL);

		verify(passwordResetTokenRepository, never()).save(any());
		verify(emailService, never()).sendPasswordResetEmail(anyString(), anyString());
	}

	@Test
	@DisplayName("실패: OAuth 계정은 비밀번호 재설정 불가")
	void requestPasswordReset_oauthAccount_throwsException() {
		given(memberRepository.findByEmailAndIsDeletedFalse(TEST_EMAIL)).willReturn(Optional.of(oauthMember));

		assertThatThrownBy(() -> passwordResetService.requestPasswordReset(TEST_EMAIL))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.PASSWORD_RESET_NOT_LOCAL);

		verify(passwordResetTokenRepository, never()).save(any());
		verify(emailService, never()).sendPasswordResetEmail(anyString(), anyString());
	}

	@Test
	@DisplayName("성공: 유효한 토큰 검증")
	void verifyResetToken_success() {
		String rawToken = "valid-raw-token";
		PasswordResetToken stored = PasswordResetToken.create(TEST_EMAIL, "some-hash");
		given(passwordResetTokenRepository.findByTokenHash(anyString())).willReturn(Optional.of(stored));

		passwordResetService.verifyResetToken(rawToken);
	}

	@Test
	@DisplayName("실패: 존재하지 않는 토큰 검증 시 예외")
	void verifyResetToken_invalid_throwsException() {
		given(passwordResetTokenRepository.findByTokenHash(anyString())).willReturn(Optional.empty());

		assertThatThrownBy(() -> passwordResetService.verifyResetToken("invalid-token"))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_RESET_TOKEN);
	}

	@Test
	@DisplayName("성공: 유효한 토큰으로 비밀번호 변경 후 토큰 삭제")
	void confirmPasswordReset_success() {
		String rawToken = "valid-token";
		String newPassword = "newPassword123!";
		PasswordResetToken stored = PasswordResetToken.create(TEST_EMAIL, "some-hash");

		given(passwordResetTokenRepository.findByTokenHash(anyString())).willReturn(Optional.of(stored));
		given(memberRepository.findByEmailAndIsDeletedFalse(TEST_EMAIL)).willReturn(Optional.of(localMember));
		given(passwordEncoder.encode(newPassword)).willReturn("new-hashed-pw");

		passwordResetService.confirmPasswordReset(rawToken, newPassword);

		verify(passwordResetTokenRepository).deleteById(TEST_EMAIL);
	}

	@Test
	@DisplayName("실패: 유효하지 않은 토큰으로 비밀번호 변경 시 예외")
	void confirmPasswordReset_invalidToken_throwsException() {
		given(passwordResetTokenRepository.findByTokenHash(anyString())).willReturn(Optional.empty());

		assertThatThrownBy(() -> passwordResetService.confirmPasswordReset("bad-token", "newPassword123!"))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_RESET_TOKEN);
	}
}

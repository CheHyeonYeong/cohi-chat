package com.coDevs.cohiChat.auth;

import static org.assertj.core.api.AssertionsForClassTypes.*;
import static org.mockito.BDDMockito.*;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.coDevs.cohiChat.auth.request.LoginRequest;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.MemberRepository;
import com.coDevs.cohiChat.member.entity.Member;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

	@Mock
	MemberRepository memberRepository;

	@Mock
	PasswordEncoder passwordEncoder;

	@InjectMocks
	AuthService authService;

	@Test
	void login_success() {
		// given
		Member member = Member.builder()
			.username("user")
			.displayName("유저")
			.email("user@test.com")
			.hashedPassword("hashedPw")
			.isHost(false)
			.build();

		given(memberRepository.findByUsername("user"))
			.willReturn(Optional.of(member));
		given(passwordEncoder.matches("pw", "hashedPw"))
			.willReturn(true);

		// when
		Member result = authService.login(new LoginRequest("user", "pw"));

		// then
		assertThat(result)
			.isNotNull()
			.isEqualTo(member);
	}

	@Test
	void login_fail_when_password_mismatch() {
		// given
		Member member = Member.builder()
			.username("user")
			.displayName("유저")
			.email("user@test.com")
			.hashedPassword("hashedPw")
			.isHost(false)
			.build();

		given(memberRepository.findByUsername("user"))
			.willReturn(Optional.of(member));
		given(passwordEncoder.matches(any(), any()))
			.willReturn(false);

		// when & then
		assertThatThrownBy(() ->
			authService.login(new LoginRequest("user", "wrongPw"))
		)
			.isInstanceOf(CustomException.class)
			.satisfies(ex -> {
				CustomException e = (CustomException) ex;
				assertThat(e.getErrorCode())
					.isEqualTo(ErrorCode.PASSWORD_MISMATCH);
			});
	}

	@Test
	void login_fail_when_user_not_found() {
		// given
		given(memberRepository.findByUsername("user"))
			.willReturn(Optional.empty());

		// when & then
		assertThatThrownBy(() ->
			authService.login(new LoginRequest("user", "pw"))
		)
			.isInstanceOf(CustomException.class)
			.satisfies(ex -> {
				CustomException e = (CustomException) ex;
				assertThat(e.getErrorCode())
					.isEqualTo(ErrorCode.USER_NOT_FOUND);
			});
	}
}

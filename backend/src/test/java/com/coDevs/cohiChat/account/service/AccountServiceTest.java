/*
package com.coDevs.cohiChat.account.service;

import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.coDevs.cohiChat.auth.dto.LoginRequest;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.repository.MemberRepository;

*/
/**
 * AccountService의 회원가입 및 회원 삭제 기능을 검증하는 단위 테스트 클래스.
 *
 * <p>회원가입 시 입력값 검증, 중복 체크, 비밀번호 암호화 여부를 확인하며,
 * 회원 삭제 시 저장소에서 정상적으로 삭제 요청이 발생하는지를 검증한다.</p>
 *//*

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

	@Mock
	private MemberRepository memberRepository;

	@Mock
	private PasswordEncoder passwordEncoder;

	@InjectMocks
	private AccountService accountService;

	// ===== 로그인 =====

	@Test
	void 로그인_성공_username과_비밀번호_일치() {
		LoginRequest request = new LoginRequest("testuser", "password123");

		Member member = new Member(
			"testuser",
			"test_nickname",
			"test@test.com",
			"ENCODED"
		);

		when(memberRepository.findByUsername("testuser"))
			.thenReturn(Optional.of(member));

		when(passwordEncoder.matches("password123", "ENCODED"))
			.thenReturn(true);

		Member result = accountService.authenticate(request);

		assertThat(result.getUsername()).isEqualTo("testuser");
	}

	@Test
	void 로그인_실패_username_없음() {
		// arrange
		LoginRequest request = new LoginRequest("testuser", "password123");

		when(memberRepository.findByUsername("testuser"))
			.thenReturn(Optional.empty());

		// act & assert
		assertThatThrownBy(() -> accountService.authenticate(request))
			.isInstanceOf(IllegalStateException.class)
			.hasMessageContaining("username");
	}

	@Test
	void 로그인_실패_비밀번호_불일치() {
		// arrange
		LoginRequest request = new LoginRequest("testuser", "password123");

		Member member = new Member(
			"testuser",
			"testuser",
			"test@test.com",
			"ENCODED"
		);

		when(memberRepository.findByUsername("testuser"))
			.thenReturn(Optional.of(member));

		when(passwordEncoder.matches("password123", "ENCODED"))
			.thenReturn(false);

		// act & assert
		assertThatThrownBy(() -> accountService.authenticate(request))
			.isInstanceOf(IllegalStateException.class)
			.hasMessageContaining("password");
	}


}
*/

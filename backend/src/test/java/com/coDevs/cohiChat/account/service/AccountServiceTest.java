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

import com.coDevs.cohiChat.account.dto.LoginRequest;
import com.coDevs.cohiChat.account.dto.SignupRequest;
import com.coDevs.cohiChat.account.dto.UpdateMemberRequest;
import com.coDevs.cohiChat.account.entity.Member;
import com.coDevs.cohiChat.account.repository.MemberRepository;

/**
 * AccountService의 회원가입 및 회원 삭제 기능을 검증하는 단위 테스트 클래스.
 *
 * <p>회원가입 시 입력값 검증, 중복 체크, 비밀번호 암호화 여부를 확인하며,
 * 회원 삭제 시 저장소에서 정상적으로 삭제 요청이 발생하는지를 검증한다.</p>
 */
@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

	@Mock
	private MemberRepository memberRepository;

	@Mock
	private PasswordEncoder passwordEncoder;

	@InjectMocks
	private AccountService accountService;

	// ===== 회원가입 =====
	/**
	 * 모든 입력값이 유효한 경우 회원가입이 성공적으로 수행된다.
	 *
	 * <p>username/email 중복이 없고,
	 * 비밀번호가 정상적으로 암호화되어 저장되는지를 검증한다.</p>
	 */

	@Test
	void signupSuccessWhenAllInputsAreValid() {
		// given
		SignupRequest request = new SignupRequest(
			"testuser",
			"test_nickname",
			"test@test.com",
			"password123",
			"password123",
			true
		);

		when(memberRepository.existsByUsername("testuser")).thenReturn(false);
		when(memberRepository.existsByEmail("test@test.com")).thenReturn(false);
		when(passwordEncoder.encode("password123")).thenReturn("ENCODED");

		when(memberRepository.save(any(Member.class)))
			.thenAnswer(invocation -> invocation.getArgument(0));

		// when
		Member result = accountService.signup(request);

		// then
		assertThat(result.getUsername()).isEqualTo("testuser");
	}

	/**
	 * 이미 존재하는 username으로 회원가입을 시도할 경우 예외가 발생한다.
	 */
	@Test
	void signupFailWhenUsernameIsDuplicated() {
		SignupRequest request = new SignupRequest(
			"testuser",
			"test_nickname",
			"test@test.com",
			"password123",
			"password123",
			true
		);

		when(memberRepository.existsByUsername("testuser")).thenReturn(true);

		assertThatThrownBy(() -> accountService.signup(request))
			.isInstanceOf(IllegalStateException.class)
			.hasMessageContaining("username");
	}
	/**
	 * 이미 존재하는 email로 회원가입을 시도할 경우 예외가 발생한다.
	 */

	@Test
	void signupFailWhenEmailIsDuplicated() {
		SignupRequest request = new SignupRequest(
			"testuser",
			"test_nickname",
			"test@test.com",
			"password123",
			"password123",
			true
		);

		when(memberRepository.existsByEmail("test@test.com")).thenReturn(true);

		assertThatThrownBy(() -> accountService.signup(request))
			.isInstanceOf(IllegalStateException.class)
			.hasMessageContaining("email");
	}

	// ===== 회원 삭제 =====
	/**
	 * 회원 삭제 요청 시 해당 사용자가 DB에서 삭제된다.
	 */
	@Test
	void deleteMemberRemovesUser() {
		Member member = new Member(
			"testuser",
			"test_nickname",
			"test@test.com",
			"ENCODED"
		);

		when(memberRepository.findByUsername("testuser"))
			.thenReturn(Optional.of(member));

		accountService.deleteMember("testuser");

		verify(memberRepository).delete(member);
	}

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

	// ===== 회원 조회 =====

	@Test
	void 회원_정보_조회_성공() {
		Member member = new Member(
			"testuser",
			"test_nickname",
			"test@test.com",
			"ENCODE"
		);

		when(memberRepository.findByUsername("testuser"))
			.thenReturn(Optional.of(member));

		Member result = accountService.getMemberByUsername("testuser");

		assertThat(result.getUsername()).isEqualTo("testuser");
	}

	// ===== 회원 수정 =====

	@Test
	void 표시명_수정_성공() {
		Member member = new Member(
			"testuser",
			"test_nickname",
			"test@test.com",
			"ENCODE"
		);

		UpdateMemberRequest request = new UpdateMemberRequest("new_name", null);

		when(memberRepository.findByUsername("testuser"))
			.thenReturn(Optional.of(member));

		Member result = accountService.updateMember("testuser", request);

		assertThat(result.getDisplayName()).isEqualTo("new_name");
	}

	@Test
	void 비밀번호_변경시_해시되어_저장() {
		Member member = new Member(
			"testuser",
			"test_nickname",
			"test@test.com",
			"ENCODED"
		);

		UpdateMemberRequest request = new UpdateMemberRequest(null, "newPassword");

		when(memberRepository.findByUsername("testuser"))
			.thenReturn(Optional.of(member));

		when(passwordEncoder.encode("newPassword"))
			.thenReturn("NEW_HASH");

		Member result = accountService.updateMember("testuser", request);

		assertThat(result.getHashedPassword()).isEqualTo("NEW_HASH");
	}

}

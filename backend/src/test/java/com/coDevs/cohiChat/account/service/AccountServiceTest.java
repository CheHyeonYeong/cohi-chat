package com.coDevs.cohiChat.account.service;

import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
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

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

	@Mock
	private MemberRepository memberRepository;

	@Mock
	private PasswordEncoder passwordEncoder;

	@InjectMocks
	private AccountService accountService;

	@BeforeEach
	void setUp() {
		when(memberRepository.save(any(Member.class)))
			.thenAnswer(invocation -> invocation.getArgument(0));
	}

	// ===== 회원가입 =====

	@Test
	void 회원가입_성공_모든_입력_항목이_유효하면() {
		SignupRequest request = new SignupRequest(
			"testuser",
			"test@test.com",
			"password123",
			"password123",
			"test_nickname",
			true
		);

		when(memberRepository.existsByUsername("testuser")).thenReturn(false);
		when(memberRepository.existsByEmail("test@test.com")).thenReturn(false);
		when(passwordEncoder.encode("password123")).thenReturn("ENCODED");

		Member result = accountService.signup(request);

		assertThat(result)
			.extracting(
				Member::getUsername,
				Member::getEmail,
				Member::isHost
			)
			.containsExactly(
				"testuser",
				"test@test.com",
				false
			);
	}

	@Test
	void 회원가입_실패_username_중복() {
		SignupRequest request = new SignupRequest(
			"testuser",
			"test@test.com",
			"password123",
			"password123",
			"test_nickname",
			true
		);

		when(memberRepository.existsByUsername("testuser")).thenReturn(true);

		assertThatThrownBy(() -> accountService.signup(request))
			.isInstanceOf(IllegalStateException.class)
			.hasMessageContaining("username");
	}

	@Test
	void 회원가입_실패_email_중복() {
		SignupRequest request = new SignupRequest(
			"testuser",
			"test@test.com",
			"password123",
			"password123",
			"test_nickname",
			true
		);

		when(memberRepository.existsByEmail("test@test.com")).thenReturn(true);

		assertThatThrownBy(() -> accountService.signup(request))
			.isInstanceOf(IllegalStateException.class)
			.hasMessageContaining("email");
	}

	// ===== 로그인 =====

	@Test
	void 로그인_성공_username과_비밀번호_일치() {
		LoginRequest request = new LoginRequest("testuser", "password123");

		Member member = new Member(
			"testuser",
			"test@test.com",
			"ENCODED",
			"LOCAL"
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
		LoginRequest request = new LoginRequest("testuser", "password123");

		when(memberRepository.findByUsername("testuser"))
			.thenReturn(Optional.empty());

		assertThatThrownBy(() -> accountService.authenticate(request))
			.isInstanceOf(IllegalStateException.class)
			.hasMessageContaining("username");
	}

	@Test
	void 로그인_실패_비밀번호_불일치() {
		LoginRequest request = new LoginRequest("testuser", "password123");

		Member member = new Member(
			"testuser",
			"test@test.com",
			"ENCODED",
			"LOCAL"
		);

		when(memberRepository.findByUsername("testuser"))
			.thenReturn(Optional.of(member));

		when(passwordEncoder.matches("password123", "ENCODED"))
			.thenReturn(false);

		assertThatThrownBy(() -> accountService.authenticate(request))
			.isInstanceOf(IllegalStateException.class)
			.hasMessageContaining("password");
	}

	// ===== 회원 조회 =====

	@Test
	void 회원_정보_조회_성공() {
		Member member = new Member(
			"testuser",
			"test@test.com",
			"ENCODED",
			"LOCAL"
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
			"test@test.com",
			"ENCODED",
			"LOCAL"
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
			"test@test.com",
			"OLD_HASH",
			"LOCAL"
		);

		UpdateMemberRequest request = new UpdateMemberRequest(null, "newPassword");

		when(memberRepository.findByUsername("testuser"))
			.thenReturn(Optional.of(member));

		when(passwordEncoder.encode("newPassword"))
			.thenReturn("NEW_HASH");

		Member result = accountService.updateMember("testuser", request);

		assertThat(result.getHashedPassword()).isEqualTo("NEW_HASH");
	}

	// ===== 회원 삭제 =====

	@Test
	void 계정_삭제시_사용자_삭제() {
		Member member = new Member(
			"testuser",
			"test@test.com",
			"ENCODED",
			"LOCAL"
		);

		when(memberRepository.findByUsername("testuser"))
			.thenReturn(Optional.of(member));

		accountService.deleteMember("testuser");

		verify(memberRepository).delete(member);
	}
}

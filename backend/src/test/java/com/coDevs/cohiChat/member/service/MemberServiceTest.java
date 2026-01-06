package com.coDevs.cohiChat.member.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.dto.SignupRequestDTO;
import com.coDevs.cohiChat.member.dto.UpdateMemberRequestDTO;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.repository.MemberRepository;

@ExtendWith(MockitoExtension.class)
class MemberServiceTest {
	@Mock
	private MemberRepository memberRepository;

	@Mock
	private PasswordEncoder passwordEncoder;

	@InjectMocks
	private MemberService memberService;

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
		SignupRequestDTO request = new SignupRequestDTO(
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
		Member result = memberService.signup(request);

		// then
		assertThat(result.getUsername()).isEqualTo("testuser");
	}

	/**
	 * 이미 존재하는 username으로 회원가입을 시도할 경우 예외가 발생한다.
	 */
	@Test
	void signupFailWhenUsernameIsDuplicated() {
		SignupRequestDTO request = new SignupRequestDTO(
			"testuser",
			"test_nickname",
			"test@test.com",
			"password123",
			"password123",
			true
		);

		when(memberRepository.existsByUsername("testuser"))
			.thenReturn(true);

		assertThatThrownBy(() ->  memberService.signup(request))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode")
			.isEqualTo(ErrorCode.DUPLICATED_USERNAME);

	}

	/**
	 * 이미 존재하는 email로 회원가입을 시도할 경우 예외가 발생한다.
	 */

	@Test
	void signupFailWhenEmailIsDuplicated() {
		SignupRequestDTO request = new SignupRequestDTO(
			"testuser",
			"test_nickname",
			"test@test.com",
			"password123",
			"password123",
			true
		);

		when(memberRepository.existsByEmail("test@test.com"))
			.thenReturn(true);

		assertThatThrownBy(() ->  memberService.signup(request))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode")
			.isEqualTo(ErrorCode.DUPLICATED_EMAIL);
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

		memberService.deleteUser("testuser");

		verify(memberRepository).delete(member);
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

		Member result =  memberService.getByUsername("testuser");

		assertThat(result.getUsername()).isEqualTo("testuser");
	}

	// ===== 회원 수정 =====

	@Test
	void shouldUpdateDisplayNameSuccessfully() {
		Member member = new Member(
			"testuser",
			"test_nickname",
			"test@test.com",
			"ENCODE"
		);

		UpdateMemberRequestDTO request = new UpdateMemberRequestDTO("new_name", null);

		when(memberRepository.findByUsername("testuser"))
			.thenReturn(Optional.of(member));

		Member result =  memberService.updateUser("testuser", request);

		assertThat(result.getDisplayName()).isEqualTo("new_name");
	}

	@Test
	void shouldEncodePassword_whenPasswordIsUpdated() {
		Member member = new Member(
			"testuser",
			"test_nickname",
			"test@test.com",
			"ENCODED"
		);

		UpdateMemberRequestDTO request = new UpdateMemberRequestDTO(null, "newPassword");

		when(memberRepository.findByUsername("testuser"))
			.thenReturn(Optional.of(member));

		when(passwordEncoder.encode("newPassword"))
			.thenReturn("NEW_HASH");

		Member result =  memberService.updateUser("testuser", request);

		assertThat(result.getHashedPassword()).isEqualTo("NEW_HASH");
	}
}
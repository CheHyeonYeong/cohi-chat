package com.coDevs.cohiChat.member;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.ArgumentMatchers.any;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import static org.mockito.ArgumentMatchers.anyString;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.request.SignupLocalRequestDTO;
import com.coDevs.cohiChat.member.response.SignupResponseDTO;

@ExtendWith(MockitoExtension.class)
class MemberServiceTest {

	@Mock
	private MemberRepository memberRepository;

	@Mock
	private PasswordEncoder passwordEncoder;

	@InjectMocks
	private MemberService memberService;

	@Test
	@DisplayName("성공: 모든 입력 항목이 존재하면 계정 생성")
	void signupSuccess() {

		SignupLocalRequestDTO request = SignupLocalRequestDTO.builder()
			.username("testuser")
			.password("password123") // 유효성 검사 통과를 위해 수정
			.email("test@test.com")
			.displayName("테스트")
			.build();

		given(passwordEncoder.encode(anyString())).willReturn("encoded_password");

		given(memberRepository.save(any(Member.class)))
			.willAnswer(invocation -> invocation.getArgument(0));

		SignupResponseDTO result = memberService.signupLocal(request);

		assertThat(result.getUsername()).isEqualTo(request.getUsername());
	}

	@Test
	@DisplayName("실패: 사용자명이 없으면 유효하지 않다는 오류 반환")
	void signupFailWithoutUsername() {

		SignupLocalRequestDTO request = SignupLocalRequestDTO.builder()
			.username(null)
			.email("test@test.com")
			.password("password123!")
			.build();

		assertThatThrownBy(() -> memberService.signupLocal(request))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_USERNAME);
	}

	@Test
	@DisplayName("실패: 중복된 사용자명이 존재하면 오류 반환")
	void signupFailDuplicateUsername() {

		String duplicateUsername = "testuser";

		SignupLocalRequestDTO request = SignupLocalRequestDTO.builder()
			.username(duplicateUsername)
			.password("password123")
			.build();

		given(memberRepository.existsByUsername(duplicateUsername)).willReturn(true);

		assertThatThrownBy(() -> memberService.signupLocal(request))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.DUPLICATED_USERNAME);

	}

	@Test
	@DisplayName("성공: 표시명이 없으면 무작위 문자열 8글자 생성")
	void signupWithRandomDisplayName() {

		SignupLocalRequestDTO request = SignupLocalRequestDTO.builder()
			.username("testuser")
			.displayName(null)
			.email("test@test.com")
			.password("password123")
			.build();

		given(passwordEncoder.encode(anyString()))
			.willReturn("hashed_password");

		given(memberRepository.save(any(Member.class)))
			.willAnswer(invocation -> invocation.getArgument(0));

		SignupResponseDTO result = memberService.signupLocal(request);

		assertThat(result.getDisplayName().length()).isEqualTo(8);
	}

}
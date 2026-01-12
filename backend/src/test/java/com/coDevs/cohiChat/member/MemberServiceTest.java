package com.coDevs.cohiChat.member;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.entity.AuthProvider;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;
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

	private Member member;

	@BeforeEach
	void setUp() {
		member = Member.create(
			"test",
			"testNickname",
			"test@test.com",
			"hashPassword",
			Role.GUEST
		);
	}

	@Test
	@DisplayName("성공: 모든 입력 항목이 존재하면 계정 생성")
	void signupSuccess() {

		SignupLocalRequestDTO request = SignupLocalRequestDTO.builder()
			.provider(AuthProvider.LOCAL)
			.username("testuser")
			.displayName("nickname")
			.email("test@test.com")
			.password("password123")
			.role(Role.GUEST)
			.build();

		given(memberRepository.existsByUsername("testuser"))
			.willReturn(false);
		given(memberRepository.existsByEmail("test@test.com"))
			.willReturn(false);
		given(passwordEncoder.encode("password123"))
			.willReturn("hashedPassword");
		given(memberRepository.save(any(Member.class)))
			.willAnswer(invocation -> invocation.getArgument(0));

		SignupResponseDTO result = memberService.signupLocal(request);

		assertThat(result.getUsername()).isEqualTo("testuser");
	}

	@Test
	@DisplayName("실패: 사용자명이 없으면 유효하지 않다는 오류 반환")
	void signupFailWithoutUsername() {

		SignupLocalRequestDTO request = SignupLocalRequestDTO.builder()
			.provider(AuthProvider.LOCAL)
			.username(null)
			.displayName("nickname")
			.email("test@test.com")
			.password("password123")
			.role(Role.GUEST)
			.build();


		assertThatThrownBy(() -> memberService.signupLocal(request))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode")
			.isEqualTo(ErrorCode.INVALID_USERNAME);
	}

	@Test
	@DisplayName("실패: 계정 id가 중복되면 오류")
	void signupFailWithDuplicateUsername() {

		SignupLocalRequestDTO request = SignupLocalRequestDTO.builder()
			.provider(AuthProvider.LOCAL)
			.username("testuser")
			.displayName("nickname")
			.email("test@test.com")
			.password("password123")
			.role(Role.GUEST)
			.build();


		given(memberRepository.existsByUsername("testuser"))
			.willReturn(true);

		assertThatThrownBy(() -> memberService.signupLocal(request))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode")
			.isEqualTo(ErrorCode.DUPLICATED_USERNAME);
	}

	@Test
	@DisplayName("실패: 계정 email이 중복되면 오류")
	void signupFailWithDuplicateEmail() {

		SignupLocalRequestDTO request = SignupLocalRequestDTO.builder()
			.provider(AuthProvider.LOCAL)
			.username("testuser")
			.displayName("nickname")
			.email("test@test.com")
			.password("password123")
			.role(Role.GUEST)
			.build();

		given(memberRepository.existsByUsername("testuser"))
			.willReturn(false);
		given(memberRepository.existsByEmail("test@test.com"))
			.willReturn(true);

		assertThatThrownBy(() -> memberService.signupLocal(request))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode")
			.isEqualTo(ErrorCode.DUPLICATED_EMAIL);
	}

	@Test
	@DisplayName("성공: 표시명이 없으면 무작위 문자열 8글자 생성")
	void signupWithRandomDisplayName() {

		SignupLocalRequestDTO request = SignupLocalRequestDTO.builder()
			.provider(AuthProvider.LOCAL)
			.username("testuser")
			.displayName(null)
			.email("test@test.com")
			.password("password123")
			.role(Role.GUEST)
			.build();


		given(memberRepository.existsByUsername("testuser"))
			.willReturn(false);
		given(memberRepository.existsByEmail("test@test.com"))
			.willReturn(false);
		given(passwordEncoder.encode("password123"))
			.willReturn("hashed_password");
		given(memberRepository.save(any(Member.class)))
			.willAnswer(invocation -> invocation.getArgument(0));

		SignupResponseDTO result = memberService.signupLocal(request);

		assertThat(result.getDisplayName()).isNotNull();
		assertThat(result.getDisplayName().length()).isEqualTo(8);
	}

}
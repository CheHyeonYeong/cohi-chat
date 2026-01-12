package com.coDevs.cohiChat.member;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.ArgumentMatchers.any;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.global.security.jwt.JwtTokenProvider;
import com.coDevs.cohiChat.member.entity.AuthProvider;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.member.request.LoginLocalRequestDTO;
import com.coDevs.cohiChat.member.request.SignupLocalRequestDTO;
import com.coDevs.cohiChat.member.response.LoginResponseDTO;
import com.coDevs.cohiChat.member.response.SignupResponseDTO;

@ExtendWith(MockitoExtension.class)
class MemberServiceTest {

	private Member member;

	@Mock
	private MemberRepository memberRepository;

	@Mock
	private PasswordEncoder passwordEncoder;

	@InjectMocks
	private MemberService memberService;

	@Mock
	private JwtTokenProvider jwtTokenProvider;


	@BeforeEach
	void setUp() {
		member = Member.create(
			"test",
			"testNickname",
			"test@test.com",
			"hashedPassword",
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

	@Test
	@DisplayName("성공: 로그인 성공")
	void loginSuccess() {

		LoginLocalRequestDTO request = LoginLocalRequestDTO.of("loginUser", "password123");

		given(memberRepository.findByUsername("loginUser"))
			.willReturn(Optional.of(member));
		given(passwordEncoder.matches("password123", "hashedPassword"))
			.willReturn(true);
		given(jwtTokenProvider.createAccessToken(any(), any()))
			.willReturn("test-access-token");

		LoginResponseDTO response = memberService.login(request);

		assertThat(response.getAccessToken()).isNotNull();
		assertThat(response.getAccessToken()).isEqualTo("test-access-token");
	}

	@Test
	@DisplayName("실패: 존재하지 않는 아이디로 로그인 시 오류 반환")
	void loginFailUserNotFound() {

		LoginLocalRequestDTO request = LoginLocalRequestDTO.of("wrongUser", "password123");

		given(memberRepository.findByUsername("wrongUser"))
			.willReturn(Optional.empty());

		assertThatThrownBy(() -> memberService.login(request))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode")
			.isEqualTo(ErrorCode.USER_NOT_FOUND);

	}

	@Test
	@DisplayName("실패: 비밀번호 틀리면 오류 반환")
	void loginFailPasswordMismatch() {

		LoginLocalRequestDTO request = LoginLocalRequestDTO.of("loginUser", "wrongPassword");

		given(memberRepository.findByUsername("loginUser"))
			.willReturn(Optional.of(member));
		given(passwordEncoder.matches("wrongPassword", "hashedPassword"))
			.willReturn(false);

		assertThatThrownBy(() -> memberService.login(request))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode")
			.isEqualTo(ErrorCode.PASSWORD_MISMATCH);
	}

}
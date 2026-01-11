package com.coDevs.cohiChat.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.coDevs.cohiChat.auth.entity.AuthProvider;
import com.coDevs.cohiChat.auth.request.LocalLoginRequestDTO;
import com.coDevs.cohiChat.auth.request.LocalSignupRequestDTO;
import com.coDevs.cohiChat.auth.response.LoginResponseDTO;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.global.security.jwt.JwtTokenProvider;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.member.MemberRepository;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

	@Mock
	private MemberRepository memberRepository;

	@Mock
	private JwtTokenProvider jwtTokenProvider;

	@Mock
	private PasswordEncoder passwordEncoder;

	@InjectMocks
	private AuthService authService;

	private Member member;

	@BeforeEach
	void setUp() {
		member = Member.create(
			"loginUser",
			"loginNickname",
			"login@test.com",
			"hashedPassword",
			Role.GUEST
		);
	}

	@Test
	@DisplayName("성공: 모든 입력 항목이 존재하면 계정 생성")
	void signupSuccess() {

		LocalSignupRequestDTO request = LocalSignupRequestDTO.builder()
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

		Member result = authService.signupLocal(request);

		assertThat(result.getUsername()).isEqualTo("testuser");
		assertThat(result.getHashedPassword()).isEqualTo("hashedPassword");
	}

	@Test
	@DisplayName("실패: 사용자명이 없으면 유효하지 않다는 오류 반환")
	void signupFailWithoutUsername() {

		LocalSignupRequestDTO request = LocalSignupRequestDTO.builder()
			.provider(AuthProvider.LOCAL)
			.username(null)
			.displayName("nickname")
			.email("test@test.com")
			.password("password123")
			.role(Role.GUEST)
			.build();


		assertThatThrownBy(() -> authService.signupLocal(request))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode")
			.isEqualTo(ErrorCode.INVALID_USERNAME);
	}

	@Test
	@DisplayName("실패: 계정 id가 중복되면 오류")
	void signupFailWithDuplicateUsername() {

		LocalSignupRequestDTO request = LocalSignupRequestDTO.builder()
			.provider(AuthProvider.LOCAL)
			.username("testuser")
			.displayName("nickname")
			.email("test@test.com")
			.password("password123")
			.role(Role.GUEST)
			.build();


		given(memberRepository.existsByUsername("testuser"))
			.willReturn(true);

		assertThatThrownBy(() -> authService.signupLocal(request))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode")
			.isEqualTo(ErrorCode.DUPLICATED_USERNAME);
	}

	@Test
	@DisplayName("실패: 계정 email이 중복되면 오류")
	void signupFailWithDuplicateEmail() {

		LocalSignupRequestDTO request = LocalSignupRequestDTO.builder()
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

		assertThatThrownBy(() -> authService.signupLocal(request))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode")
			.isEqualTo(ErrorCode.DUPLICATED_EMAIL);
	}

	@Test
	@DisplayName("성공: 표시명이 없으면 무작위 문자열 8글자 생성")
	void signupWithRandomDisplayName() {

		LocalSignupRequestDTO request = LocalSignupRequestDTO.builder()
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

		Member result = authService.signupLocal(request);

		assertThat(result.getDisplayName()).isNotNull();
		assertThat(result.getDisplayName().length()).isEqualTo(8);
	}

	@Test
	@DisplayName("성공: 로그인 성공")
	void loginSuccess() {

		LocalLoginRequestDTO request = LocalLoginRequestDTO.builder()
			.provider(AuthProvider.LOCAL)
			.username("loginUser")
			.password("password123")
			.build();

		given(memberRepository.findByUsername("loginUser"))
			.willReturn(Optional.of(member));
		given(passwordEncoder.matches("password123", "hashedPassword"))
			.willReturn(true);
		given(jwtTokenProvider.createAccessToken(any(), any()))
			.willReturn("test-access-token");

		LoginResponseDTO response = authService.login(request);

		assertThat(response.accessToken()).isNotNull();
		assertThat(response.accessToken()).isEqualTo("test-access-token");
	}

	@Test
	@DisplayName("실패: 존재하지 않는 아이디로 로그인 시 오류 반환")
	void loginFailUserNotFound() {

		LocalLoginRequestDTO request = LocalLoginRequestDTO.builder()
			.provider(AuthProvider.LOCAL)
			.username("wrongUser")
			.password("password123")
			.build();

		given(memberRepository.findByUsername("wrongUser"))
			.willReturn(Optional.empty());

		assertThatThrownBy(() -> authService.login(request))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode")
			.isEqualTo(ErrorCode.USER_NOT_FOUND);

	}

	@Test
	@DisplayName("실패: 비밀번호 틀리면 오류 반환")
	void loginFailPasswordMismatch() {

		LocalLoginRequestDTO request = LocalLoginRequestDTO.builder()
			.provider(AuthProvider.LOCAL)
			.username("loginUser")
			.password("wrongPassword")
			.build();

		given(memberRepository.findByUsername("loginUser"))
			.willReturn(Optional.of(member));
		given(passwordEncoder.matches("wrongPassword", "hashedPassword"))
			.willReturn(false);

		assertThatThrownBy(() -> authService.login(request))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode")
			.isEqualTo(ErrorCode.PASSWORD_MISMATCH);
	}

}
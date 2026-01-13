package com.coDevs.cohiChat.member;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;

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

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.global.security.jwt.JwtTokenProvider;
import com.coDevs.cohiChat.member.entity.Provider;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.member.request.LoginRequestDTO;
import com.coDevs.cohiChat.member.request.SignupRequestDTO;
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
		member = Member.create("test", "testNickname", "test@test.com", "hashedPassword", Role.GUEST);
	}

	private SignupRequestDTO createSignupRequest(String username, String email, String displayName) {
		return SignupRequestDTO.builder()
			.provider(Provider.LOCAL)
			.username(username)
			.email(email)
			.displayName(displayName)
			.password("password123")
			.role(Role.GUEST)
			.build();
	}

	private LoginRequestDTO createLoginRequest(String username, String password) {
		return LoginRequestDTO.builder()
			.username(username)
			.password(password)
			.build();
	}

	@Test
	@DisplayName("성공: 모든 입력 항목이 존재하면 계정 생성")
	void signupSuccess() {

		SignupRequestDTO request = createSignupRequest("testuser", "test@test.com", "nickname");

		given(memberRepository.existsByUsername("testuser"))
			.willReturn(false);
		given(memberRepository.existsByEmail("test@test.com"))
			.willReturn(false);
		given(passwordEncoder.encode("password123"))
			.willReturn("hashedPassword");
		given(memberRepository.save(any(Member.class)))
			.willAnswer(invocation -> invocation.getArgument(0));

		SignupResponseDTO result = memberService.signup(request);

		assertThat(result.getUsername()).isEqualTo("testuser");
	}

	@Test
	@DisplayName("성공: 사용자명이 경계값(12자)인 경우")
	void signupUsernameBoundarySuccess() {
		String maxUsername = "a".repeat(12);
		SignupRequestDTO request = createSignupRequest(maxUsername, "test@test.com", "nick");

		given(memberRepository.existsByUsername(maxUsername)).willReturn(false);
		given(memberRepository.existsByEmail(any())).willReturn(false);

		given(passwordEncoder.encode(any())).willReturn("fakeHashedPassword");

		given(memberRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

		SignupResponseDTO result = memberService.signup(request);

		assertThat(result.getUsername().length()).isEqualTo(12);
	}

	@Test
	@DisplayName("실패: 사용자명이 경계값(4자) 미만일 때")
	void signupUsernameMinBoundaryFail() {
		String tooLongUsername = "a".repeat(3);
		SignupRequestDTO request = createSignupRequest(tooLongUsername, "test@test.com", "nick");

		assertThatThrownBy(() -> memberService.signup(request))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode").isEqualTo(ErrorCode.INVALID_USERNAME);
	}

	@Test
	@DisplayName("실패: 사용자명이 경계값(12자)을 초과할 때")
	void signupUsernameMaxBoundaryFail() {
		String tooLongUsername = "a".repeat(13);
		SignupRequestDTO request = createSignupRequest(tooLongUsername, "test@test.com", "nick");

		assertThatThrownBy(() -> memberService.signup(request))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode").isEqualTo(ErrorCode.INVALID_USERNAME);
	}

	@Test
	@DisplayName("실패: 사용자명이 없으면 유효하지 않다는 오류 반환")
	void signupFailWithoutUsername() {

		SignupRequestDTO request = createSignupRequest(null, "test@test.com", "nickname");

		assertThatThrownBy(() -> memberService.signup(request))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode")
			.isEqualTo(ErrorCode.INVALID_USERNAME);
	}

	@Test
	@DisplayName("실패: 계정 id가 중복되면 오류")
	void signupFailWithDuplicateUsername() {

		SignupRequestDTO request = createSignupRequest("testuser", "test@test.com", "nickname");

		given(memberRepository.existsByUsername("testuser")).willReturn(true);

		assertThatThrownBy(() -> memberService.signup(request))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode")
			.isEqualTo(ErrorCode.DUPLICATED_USERNAME);
	}

	@Test
	@DisplayName("실패: 계정 email이 중복되면 오류")
	void signupFailWithDuplicateEmail() {

		SignupRequestDTO request = createSignupRequest("testuser", "test@test.com", "nickname");

		given(memberRepository.existsByUsername("testuser")).willReturn(false);
		given(memberRepository.existsByEmail("test@test.com")).willReturn(true);

		assertThatThrownBy(() -> memberService.signup(request))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode")
			.isEqualTo(ErrorCode.DUPLICATED_EMAIL);
	}

	@Test
	@DisplayName("성공: 표시명이 없으면 무작위 문자열 8글자 생성")
	void signupWithRandomDisplayName() {

		SignupRequestDTO request = createSignupRequest("testuser", "test@test.com", null);

		given(memberRepository.existsByUsername("testuser")).willReturn(false);
		given(memberRepository.existsByEmail("test@test.com")).willReturn(false);
		given(passwordEncoder.encode(any())).willReturn("hashed_password");
		given(memberRepository.save(any(Member.class)))
			.willAnswer(invocation -> invocation.getArgument(0));

		SignupResponseDTO result = memberService.signup(request);

		assertThat(result.getDisplayName()).isNotNull();
		assertThat(result.getDisplayName().length()).isEqualTo(8);
	}

	@Test
	@DisplayName("성공: 로그인 성공")
	void loginSuccess() {
		long expirationMillis = 3600000L;
		long expectedExpiredIn = 3600L;

		ReflectionTestUtils.setField(memberService, "accessTokenExpiration", expirationMillis);

		LoginRequestDTO request = createLoginRequest("test", "password123");

		given(memberRepository.findByUsername("test"))
			.willReturn(Optional.of(member));
		given(passwordEncoder.matches("password123", "hashedPassword"))
			.willReturn(true);
		given(jwtTokenProvider.createAccessToken(any(), any()))
			.willReturn("test-access-token");

		LoginResponseDTO response = memberService.login(request);

		assertThat(response.getAccessToken()).isEqualTo("Bearer test-access-token");
		assertThat(response.getUsername()).isEqualTo("test");
		assertThat(response.getExpiredIn()).isEqualTo(expectedExpiredIn);
	}

	@Test
	@DisplayName("실패: 아이디가 공백인 경우 (경계값 시나리오)")
	void loginFailWithBlankUsername() {
		LoginRequestDTO request = createLoginRequest("", "password123");

		assertThatThrownBy(() -> memberService.login(request))
			.isInstanceOf(CustomException.class);
	}

	@Test
	@DisplayName("실패: 존재하지 않는 아이디로 로그인 시 오류 반환")
	void loginFailUserNotFound() {
		LoginRequestDTO request = createLoginRequest("wrongUser", "password123");

		given(memberRepository.findByUsername("wrongUser"))
			.willReturn(Optional.empty());

		assertThatThrownBy(() -> memberService.login(request))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_NOT_FOUND);
	}

	@Test
	@DisplayName("실패: 비밀번호 틀리면 오류 반환")
	void loginFailPasswordMismatch() {
		LoginRequestDTO request = createLoginRequest("test", "wrongPassword");

		given(memberRepository.findByUsername("test"))
			.willReturn(Optional.of(member));
		given(passwordEncoder.matches(eq("wrongPassword"), any()))
			.willReturn(false);

		assertThatThrownBy(() -> memberService.login(request))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.PASSWORD_MISMATCH);
	}
}
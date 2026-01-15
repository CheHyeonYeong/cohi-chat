package com.coDevs.cohiChat.member;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;

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
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.member.request.LoginRequestDTO;
import com.coDevs.cohiChat.member.request.SignupRequestDTO;
import com.coDevs.cohiChat.member.request.UpdateMemberRequestDTO;
import com.coDevs.cohiChat.member.response.LoginResponseDTO;
import com.coDevs.cohiChat.member.response.SignupResponseDTO;

@ExtendWith(MockitoExtension.class)
class MemberServiceTest {

	private static final String TEST_USERNAME = "test";
	private static final String TEST_EMAIL = "test@test.com";
	private static final String TEST_PASSWORD = "testPw";
	private static final String TEST_DISPLAY_NAME = "testDisplayName";

	/**
	 * 회원가입 성공을 위한 공통 Mock 설정
	 */
	private void givenSuccessfulSignupMocks() {
		given(memberRepository.existsByUsernameAndIsDeleted(anyString())).willReturn(false);
		given(memberRepository.existsByEmail(anyString())).willReturn(false);
		given(passwordEncoder.encode(anyString())).willReturn("hashedPassword");
		given(memberRepository.save(any(Member.class))).willAnswer(inv -> inv.getArgument(0));
	}

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

		member = Member.create(TEST_USERNAME, TEST_DISPLAY_NAME, TEST_EMAIL, "hashedPassword", Role.GUEST);
	}

	@Test
	@DisplayName("성공: 모든 입력 항목이 존재하면 계정 생성")
	void signupSuccess() {
		SignupRequestDTO signupRequestDTO = SignupRequestDTO.builder()
			.username(TEST_USERNAME)
			.password(TEST_PASSWORD)
			.email(TEST_EMAIL)
			.displayName(TEST_DISPLAY_NAME)
			.build();

		givenSuccessfulSignupMocks();

		SignupResponseDTO signupResponseDTO = memberService.signup(signupRequestDTO);
		assertThat(signupResponseDTO.getUsername()).isEqualTo(TEST_USERNAME);

	}

	@Test
	@DisplayName("성공: 표시명이 없으면(null) 무작위 문자열 8글자 생성")
	void signupWithRandomDisplayName() {

		SignupRequestDTO signupRequestDTO = SignupRequestDTO.builder()
			.username(TEST_USERNAME)
			.password(TEST_PASSWORD)
			.email(TEST_EMAIL)
			.displayName(null)
			.build();

		givenSuccessfulSignupMocks();

		SignupResponseDTO signupResponseDTO = memberService.signup(signupRequestDTO);

		assertThat(signupResponseDTO.getDisplayName()).isNotNull();
		assertThat(signupResponseDTO.getDisplayName().length()).isEqualTo(8);
	}

	@Test
	@DisplayName("실패: 아이디가 경계값(4자) 미만일 때")
	void signupUsernameMinBoundaryFail() {
		String minUsername = "aaa";
		SignupRequestDTO signupRequestDTO = SignupRequestDTO.builder()
			.username(minUsername)
			.password(TEST_PASSWORD)
			.email(TEST_EMAIL)
			.displayName(TEST_DISPLAY_NAME)
			.build();

		assertThatThrownBy(() -> memberService.signup(signupRequestDTO))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode").isEqualTo(ErrorCode.INVALID_USERNAME);
	}

	@Test
	@DisplayName("성공: 아이디가 경계값(4자)일 때")
	void signupUsernameMinBoundarySuccess() {
		String minUsername = "aaaa";
		SignupRequestDTO signupRequestDTO = SignupRequestDTO.builder()
			.username(minUsername)
			.password(TEST_PASSWORD)
			.email(TEST_EMAIL)
			.displayName(TEST_DISPLAY_NAME)
			.build();

		givenSuccessfulSignupMocks();

		SignupResponseDTO signupResponseDTO = memberService.signup(signupRequestDTO);
		assertThat(signupResponseDTO.getUsername()).isEqualTo(minUsername);
	}

	@Test
	@DisplayName("실패: 아이디가 경계값(12자)을 초과할 때")
	void signupUsernameMaxBoundaryFail() {
		String maxUsername = "a".repeat(13);
		SignupRequestDTO signupRequestDTO = SignupRequestDTO.builder()
			.username(maxUsername)
			.password(TEST_PASSWORD)
			.email(TEST_EMAIL)
			.displayName(TEST_DISPLAY_NAME)
			.build();

		assertThatThrownBy(() -> memberService.signup(signupRequestDTO))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode").isEqualTo(ErrorCode.INVALID_USERNAME);
	}

	@Test
	@DisplayName("성공: 아이디가 경계값(12자)일 때")
	void signupUsernameMaxBoundarySuccess() {
		String maxUsername = "a".repeat(12);
		SignupRequestDTO signupRequestDTO = SignupRequestDTO.builder()
			.username(maxUsername)
			.password(TEST_PASSWORD)
			.email(TEST_EMAIL)
			.displayName(TEST_DISPLAY_NAME)
			.build();

		givenSuccessfulSignupMocks();

		SignupResponseDTO signupResponseDTO = memberService.signup(signupRequestDTO);
		assertThat(signupResponseDTO.getUsername()).isEqualTo(maxUsername);
	}

	@Test
	@DisplayName("실패: 비밀번호가 경계값(4자) 미만일 때")
	void signupPasswordMinBoundaryFail() {
		String minPassword = "aaaa";
		SignupRequestDTO signupRequestDTO = SignupRequestDTO.builder()
			.username(TEST_USERNAME)
			.password(minPassword)
			.email(TEST_EMAIL)
			.displayName(TEST_DISPLAY_NAME)
			.build();

		assertThatThrownBy(() -> memberService.signup(signupRequestDTO))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode").isEqualTo(ErrorCode.INVALID_PASSWORD);
	}

	@Test
	@DisplayName("성공: 비밀번호가 경계값(4자)일 때")
	void signupPasswordMinBoundarySuccess() {
		String minPassword = "aaaa";
		SignupRequestDTO signupRequestDTO = SignupRequestDTO.builder()
			.username(TEST_USERNAME)
			.password(minPassword)
			.email(TEST_EMAIL)
			.displayName(TEST_DISPLAY_NAME)
			.build();

		givenSuccessfulSignupMocks();

		SignupResponseDTO signupResponseDTO = memberService.signup(signupRequestDTO);
		assertThat(signupResponseDTO.getUsername()).isEqualTo(TEST_USERNAME);
	}

	@Test
	@DisplayName("실패: 비밀번호가 경계값(20자)를 초과할 때")
	void signupPasswordMaxBoundaryFail() {
		String maxPassword = "a".repeat(21);
		SignupRequestDTO signupRequestDTO = SignupRequestDTO.builder()
			.username(TEST_USERNAME)
			.password(maxPassword)
			.email(TEST_EMAIL)
			.displayName(TEST_DISPLAY_NAME)
			.build();

		assertThatThrownBy(() -> memberService.signup(signupRequestDTO))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode").isEqualTo(ErrorCode.INVALID_PASSWORD);
	}

	@Test
	@DisplayName("성공: 비밀번호가 경계값(20자)일 때")
	void signupPasswordMaxBoundarySuccess() {
		String maxPassword = "a".repeat(20);
		SignupRequestDTO signupRequestDTO = SignupRequestDTO.builder()
			.username(TEST_USERNAME)
			.password(maxPassword)
			.email(TEST_EMAIL)
			.displayName(TEST_DISPLAY_NAME)
			.build();

		givenSuccessfulSignupMocks();

		SignupResponseDTO signupResponseDTO = memberService.signup(signupRequestDTO);
		assertThat(signupResponseDTO.getUsername()).isEqualTo(TEST_USERNAME);
	}

	@Test
	@DisplayName("실패: 닉네임이 경계값(2자) 미만일 때")
	void signupDisplayNameMinBoundaryFail() {
		String minDisplayname = "a";
		SignupRequestDTO signupRequestDTO = SignupRequestDTO.builder()
			.username(TEST_USERNAME)
			.password(TEST_PASSWORD)
			.email(TEST_EMAIL)
			.displayName(minDisplayname)
			.build();

		assertThatThrownBy(() -> memberService.signup(signupRequestDTO))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode").isEqualTo(ErrorCode.INVALID_DISPLAY_NAME);
	}
	@Test
	@DisplayName("성공: 닉네임이 경계값(2자)일 때")
	void signupDisplayNameMinBoundarySuccess() {
		String minDisplayname = "aa";
		SignupRequestDTO signupRequestDTO = SignupRequestDTO.builder()
			.username(TEST_USERNAME)
			.password(TEST_PASSWORD)
			.email(TEST_EMAIL)
			.displayName(minDisplayname)
			.build();

		givenSuccessfulSignupMocks();

		SignupResponseDTO signupResponseDTO = memberService.signup(signupRequestDTO);
		assertThat(signupResponseDTO.getUsername()).isEqualTo(TEST_USERNAME);
	}

	@Test
	@DisplayName("실패: 닉네임이 경계값(20자)을 초과할 때")
	void signupDisplayNameMaxBoundaryFail() {
		String maxDisplayName = "a".repeat(21);
		SignupRequestDTO signupRequestDTO = SignupRequestDTO.builder()
			.username(TEST_USERNAME)
			.password(TEST_PASSWORD)
			.email(TEST_EMAIL)
			.displayName(maxDisplayName)
			.build();

		assertThatThrownBy(() -> memberService.signup(signupRequestDTO))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode").isEqualTo(ErrorCode.INVALID_DISPLAY_NAME);
	}

	@Test
	@DisplayName("성공: 닉네임이 경계값(20자)인 경우")
	void signupDisplayNameMaxBoundarySuccess() {
		String maxDisplayName = "a".repeat(20);
		SignupRequestDTO signupRequestDTO = SignupRequestDTO.builder()
			.username(TEST_USERNAME)
			.password(TEST_PASSWORD)
			.email(TEST_EMAIL)
			.displayName(maxDisplayName)
			.build();

		givenSuccessfulSignupMocks();

		SignupResponseDTO signupResponseDTO = memberService.signup(signupRequestDTO);
		assertThat(signupResponseDTO.getUsername()).isEqualTo(TEST_USERNAME);
	}

	@Test
	@DisplayName("실패: 계정 id가 중복되면 오류")
	void signupFailWithDuplicateUsername() {
		SignupRequestDTO signupRequestDTO = SignupRequestDTO.builder()
			.username(TEST_USERNAME)
			.password(TEST_PASSWORD)
			.email(TEST_EMAIL)
			.displayName(TEST_DISPLAY_NAME)
			.build();

		given(memberRepository.existsByUsernameAndIsDeleted(TEST_USERNAME)).willReturn(true);

		assertThatThrownBy(() -> memberService.signup(signupRequestDTO))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode").isEqualTo(ErrorCode.DUPLICATED_USERNAME);
	}

	@Test
	@DisplayName("실패: 계정 email 중복되면 오류")
	void signupFailWithDuplicateEmail() {
		SignupRequestDTO signupRequestDTO = SignupRequestDTO.builder()
			.username(TEST_USERNAME)
			.password(TEST_PASSWORD)
			.email(TEST_EMAIL)
			.displayName(TEST_DISPLAY_NAME)
			.build();

		given(memberRepository.existsByEmail(TEST_EMAIL)).willReturn(true);

		assertThatThrownBy(() -> memberService.signup(signupRequestDTO))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode").isEqualTo(ErrorCode.DUPLICATED_EMAIL);
	}

	@Test
	@DisplayName("성공: 로그인 성공")
	void loginSuccess() {
		LoginRequestDTO loginRequestDTO = LoginRequestDTO.builder()
			.username(TEST_USERNAME)
			.password(TEST_PASSWORD)
			.build();

		given(memberRepository.findByUsernameAndIsDeleted(TEST_USERNAME)).willReturn(Optional.of(member));
		given(passwordEncoder.matches(TEST_PASSWORD, "hashedPassword")).willReturn(true);
		given(jwtTokenProvider.createAccessToken(any(), any())).willReturn("test-access-token");
		given(jwtTokenProvider.getExpirationSeconds(anyString())).willReturn(3600L);
		LoginResponseDTO response = memberService.login(loginRequestDTO);
		assertThat(response.getAccessToken()).isEqualTo("test-access-token");
	}

	@Test
	@DisplayName("실패: 존재하지 않는 아이디로 로그인 시 오류 반환")
	void loginFailUserNotFound() {
		LoginRequestDTO request = LoginRequestDTO.builder()
			.username("wrongUser")
			.password(TEST_PASSWORD)
			.build();

		given(memberRepository.findByUsernameAndIsDeleted("wrongUser")).willReturn(Optional.empty());

		assertThatThrownBy(() -> memberService.login(request))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_NOT_FOUND);
	}

	@Test
	@DisplayName("실패: 틀린 비밀번호로 로그인 시 오류 반환")
	void loginFailPasswordMismatch() {
		LoginRequestDTO request = LoginRequestDTO.builder()
			.username(TEST_USERNAME)
			.password("wrongPassword")
			.build();

		given(memberRepository.findByUsernameAndIsDeleted(TEST_USERNAME)).willReturn(Optional.of(member));

		assertThatThrownBy(() -> memberService.login(request))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.PASSWORD_MISMATCH);
	}

	@Test
	@DisplayName("성공: 존재하는 아이디로 회원 정보 조회")
	void getMemberSuccess() {
		given(memberRepository.findByUsernameAndIsDeleted(TEST_USERNAME)).willReturn(Optional.of(member));
		Member result = memberService.getMember(TEST_USERNAME);
		assertThat(result.getUsername()).isEqualTo(TEST_USERNAME);
	}

	@Test
	@DisplayName("실패: 존재하지 않는 아이디로 회원 정보 조회 시 오류 반환")
	void getMemberFailNotFound() {
		given(memberRepository.findByUsernameAndIsDeleted("nonExist")).willReturn(Optional.empty());

		assertThatThrownBy(() -> memberService.getMember("nonExist"))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_NOT_FOUND);
	}

	@Test
	@DisplayName("성공: 닉네임과 비밀번호 모두 수정")
	void updateMemberSuccess() {
		UpdateMemberRequestDTO updateMemberRequestDTO = UpdateMemberRequestDTO.builder()
			.displayName("newNick")
			.password("newPass")
			.build();

		given(memberRepository.findByUsernameAndIsDeleted(TEST_USERNAME)).willReturn(Optional.of(member));
		given(passwordEncoder.encode("newPass")).willReturn("newHash");

		memberService.updateMember(TEST_USERNAME, updateMemberRequestDTO);
		assertThat(member.getDisplayName()).isEqualTo("newNick");
		assertThat(member.getHashedPassword()).isEqualTo("newHash");
	}

	@Test
	@DisplayName("성공: 닉네임만 변경 시 비밀번호 유지")
	void updateMemberOnlyDisplayName() {
		String oldPassword = member.getHashedPassword();
		UpdateMemberRequestDTO updateMemberRequestDTO = UpdateMemberRequestDTO.builder()
			.displayName("newNick")
			.password(null)
			.build();

		given(memberRepository.findByUsernameAndIsDeleted(TEST_USERNAME)).willReturn(Optional.of(member));

		memberService.updateMember(TEST_USERNAME, updateMemberRequestDTO);
		assertThat(member.getDisplayName()).isEqualTo("newNick");
		assertThat(member.getHashedPassword()).isEqualTo(oldPassword);
		verify(passwordEncoder, never()).encode(anyString());
	}

	@Test
	@DisplayName("성공: 비밀번호 변경 시 닉네임 유지")
	void updateMemberOnlyPassword() {
		String oldNickname = member.getDisplayName();
		UpdateMemberRequestDTO updateMemberRequestDTO = UpdateMemberRequestDTO.builder()
			.displayName(null)
			.password("newPass")
			.build();

		given(memberRepository.findByUsernameAndIsDeleted(TEST_USERNAME)).willReturn(Optional.of(member));
		given(passwordEncoder.encode("newPass")).willReturn("newHash");

		memberService.updateMember(TEST_USERNAME, updateMemberRequestDTO);
		assertThat(member.getDisplayName()).isEqualTo(oldNickname);
		assertThat(member.getHashedPassword()).isEqualTo("newHash");
	}

	@Test
	@DisplayName("실패: 닉네임과 비밀번호 둘 다 null일 때 오류 반환")
	void updateMemberFailBothNull() {
		UpdateMemberRequestDTO updateMemberRequestDTO = UpdateMemberRequestDTO.builder()
			.displayName(null)
			.password(null)
			.build();

		assertThatThrownBy(() -> memberService.updateMember(TEST_USERNAME, updateMemberRequestDTO))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.NO_UPDATE_FIELDS);

	}

	@Test
	@DisplayName("성공: 회원 탈퇴 (Soft Delete)")
	void deleteMemberSoftDeleteSuccess() {

		given(memberRepository.findByUsernameAndIsDeleted(TEST_USERNAME))
			.willReturn(Optional.of(member));

		memberService.deleteMember(TEST_USERNAME);

		assertThat(member.isDeleted()).isTrue();
		assertThat(member.getDeletedAt()).isNotNull();
	}

	@Test
	@DisplayName("실패: 존재하지 않는 회원 삭제 시 오류 반환")
	void deleteMemberFailNotFound() {
		given(memberRepository.findByUsernameAndIsDeleted("nonExist")).willReturn(Optional.empty());

		assertThatThrownBy(() -> memberService.deleteMember("nonExist"))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_NOT_FOUND);

		verify(memberRepository, never()).delete(any(Member.class));
	}
}

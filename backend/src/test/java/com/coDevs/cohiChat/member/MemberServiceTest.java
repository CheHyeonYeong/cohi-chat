package com.coDevs.cohiChat.member;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;

import java.util.Optional;

import org.mockito.ArgumentCaptor;

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
import com.coDevs.cohiChat.member.entity.AccessTokenBlacklist;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.RefreshToken;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.member.request.LoginRequestDTO;
import com.coDevs.cohiChat.member.request.SignupRequestDTO;
import com.coDevs.cohiChat.member.request.UpdateMemberRequestDTO;
import com.coDevs.cohiChat.member.response.LoginResponseDTO;
import com.coDevs.cohiChat.member.response.RefreshTokenResponseDTO;
import com.coDevs.cohiChat.member.response.SignupResponseDTO;

@ExtendWith(MockitoExtension.class)
class MemberServiceTest {

	private static final String TEST_USERNAME = "testtest";
	private static final String TEST_EMAIL = "test@test.com";
	private static final String TEST_PASSWORD = "testPassword123!";
	private static final String TEST_DISPLAY_NAME = "testDisplayName";

	/**
	 * 회원가입 성공을 위한 공통 Mock 설정
	 */
	private void givenSuccessfulSignupMocks() {
		given(memberRepository.existsByUsernameAndIsDeletedFalse(anyString())).willReturn(false);
		given(memberRepository.existsByEmail(anyString())).willReturn(false);
		given(passwordEncoder.encode(anyString())).willReturn("hashedPassword");
		given(memberRepository.save(any(Member.class))).willAnswer(inv -> inv.getArgument(0));
	}

	private Member member;

	@Mock
	private MemberRepository memberRepository;

	@Mock
	private RefreshTokenRepository refreshTokenRepository;

	@Mock
	private AccessTokenBlacklistRepository accessTokenBlacklistRepository;

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
	@DisplayName("실패: 계정 id가 중복되면 오류")
	void signupFailWithDuplicateUsername() {
		SignupRequestDTO signupRequestDTO = SignupRequestDTO.builder()
			.username(TEST_USERNAME)
			.password(TEST_PASSWORD)
			.email(TEST_EMAIL)
			.displayName(TEST_DISPLAY_NAME)
			.build();

		given(memberRepository.existsByUsernameAndIsDeletedFalse(TEST_USERNAME)).willReturn(true);

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
	@DisplayName("성공: 로그인 성공 - Access Token과 Refresh Token 모두 발급, 토큰은 해시되어 저장")
	void loginSuccess() {
		LoginRequestDTO loginRequestDTO = LoginRequestDTO.builder()
			.username(TEST_USERNAME)
			.password(TEST_PASSWORD)
			.build();

		given(memberRepository.findByUsernameAndIsDeletedFalse(TEST_USERNAME)).willReturn(Optional.of(member));
		given(passwordEncoder.matches(TEST_PASSWORD, "hashedPassword")).willReturn(true);
		given(jwtTokenProvider.createAccessToken(any(), any())).willReturn("test-access-token");
		given(jwtTokenProvider.createRefreshToken(anyString())).willReturn("test-refresh-token");
		given(jwtTokenProvider.getRefreshTokenExpirationMs()).willReturn(604800000L);
		given(jwtTokenProvider.getExpirationSeconds(anyString())).willReturn(3600L);
		given(refreshTokenRepository.save(any(RefreshToken.class))).willAnswer(inv -> inv.getArgument(0));

		LoginResponseDTO response = memberService.login(loginRequestDTO);

		assertThat(response.getAccessToken()).isEqualTo("test-access-token");
		assertThat(response.getRefreshToken()).isEqualTo("test-refresh-token");
		verify(refreshTokenRepository).deleteById(TEST_USERNAME);

		// 저장된 RefreshToken의 token 필드가 원문이 아닌 해시값인지 검증
		ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
		verify(refreshTokenRepository).save(captor.capture());
		RefreshToken savedToken = captor.getValue();
		assertThat(savedToken.getToken()).isNotEqualTo("test-refresh-token");
		assertThat(savedToken.getUsername()).isEqualTo(TEST_USERNAME);
	}

	@Test
	@DisplayName("실패: 존재하지 않는 아이디로 로그인 시 오류 반환")
	void loginFailUserNotFound() {
		LoginRequestDTO request = LoginRequestDTO.builder()
			.username("wrongUser")
			.password(TEST_PASSWORD)
			.build();

		given(memberRepository.findByUsernameAndIsDeletedFalse("wrongUser")).willReturn(Optional.empty());

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

		given(memberRepository.findByUsernameAndIsDeletedFalse(TEST_USERNAME)).willReturn(Optional.of(member));

		assertThatThrownBy(() -> memberService.login(request))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.PASSWORD_MISMATCH);
	}

	@Test
	@DisplayName("성공: 존재하는 아이디로 회원 정보 조회")
	void getMemberSuccess() {
		given(memberRepository.findByUsernameAndIsDeletedFalse(TEST_USERNAME)).willReturn(Optional.of(member));
		Member result = memberService.getMember(TEST_USERNAME);
		assertThat(result.getUsername()).isEqualTo(TEST_USERNAME);
	}

	@Test
	@DisplayName("실패: 존재하지 않는 아이디로 회원 정보 조회 시 오류 반환")
	void getMemberFailNotFound() {
		given(memberRepository.findByUsernameAndIsDeletedFalse("nonExist")).willReturn(Optional.empty());

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

		given(memberRepository.findByUsernameAndIsDeletedFalse(TEST_USERNAME)).willReturn(Optional.of(member));
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

		given(memberRepository.findByUsernameAndIsDeletedFalse(TEST_USERNAME)).willReturn(Optional.of(member));

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

		given(memberRepository.findByUsernameAndIsDeletedFalse(TEST_USERNAME)).willReturn(Optional.of(member));
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

		given(memberRepository.findByUsernameAndIsDeletedFalse(TEST_USERNAME))
			.willReturn(Optional.of(member));

		memberService.deleteMember(TEST_USERNAME);

		assertThat(member.isDeleted()).isTrue();
		assertThat(member.getDeletedAt()).isNotNull();
	}

	@Test
	@DisplayName("실패: 존재하지 않는 회원 삭제 시 오류 반환")
	void deleteMemberFailNotFound() {
		given(memberRepository.findByUsernameAndIsDeletedFalse("nonExist")).willReturn(Optional.empty());

		assertThatThrownBy(() -> memberService.deleteMember("nonExist"))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_NOT_FOUND);

		verify(memberRepository, never()).delete(any(Member.class));
	}

	@Test
	@DisplayName("성공: 유효한 Refresh Token으로 Access Token 재발급 (해시로 조회)")
	void refreshAccessTokenSuccess() {
		String validRefreshToken = "valid-refresh-token";
		String expectedHash = "ba518c093e1e0df01cfe01436563cd37f6a1f47697fcc620e818a2d062665083";
		RefreshToken storedToken = RefreshToken.create(
			expectedHash,
			TEST_USERNAME,
			604800000L // 7 days in ms
		);

		// validateTokenOrThrow는 void 메서드 - 예외 없으면 통과
		given(refreshTokenRepository.findByToken(expectedHash)).willReturn(Optional.of(storedToken));
		given(memberRepository.findByUsernameAndIsDeletedFalse(TEST_USERNAME)).willReturn(Optional.of(member));
		given(jwtTokenProvider.createAccessToken(TEST_USERNAME, "GUEST")).willReturn("new-access-token");
		given(jwtTokenProvider.getExpirationSeconds("new-access-token")).willReturn(3600L);

		RefreshTokenResponseDTO response = memberService.refreshAccessToken(validRefreshToken);

		assertThat(response.getAccessToken()).isEqualTo("new-access-token");
		assertThat(response.getExpiredInMinutes()).isEqualTo(60);
	}

	@Test
	@DisplayName("실패: 유효하지 않은 JWT Refresh Token")
	void refreshAccessTokenFailInvalidJwt() {
		String invalidToken = "invalid-token";

		willThrow(new JwtException("invalid")).given(jwtTokenProvider).validateTokenOrThrow(invalidToken);

		assertThatThrownBy(() -> memberService.refreshAccessToken(invalidToken))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_REFRESH_TOKEN);
	}

	@Test
	@DisplayName("실패: 만료된 JWT Refresh Token은 EXPIRED_REFRESH_TOKEN 반환")
	void refreshAccessTokenFailExpiredJwt() {
		String expiredToken = "expired-token";

		willThrow(new ExpiredJwtException(null, null, "expired"))
			.given(jwtTokenProvider).validateTokenOrThrow(expiredToken);

		assertThatThrownBy(() -> memberService.refreshAccessToken(expiredToken))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.EXPIRED_REFRESH_TOKEN);
	}

	@Test
	@DisplayName("실패: Redis에 존재하지 않는 Refresh Token (만료되어 삭제됨)")
	void refreshAccessTokenFailNotInRedis() {
		String tokenNotInRedis = "not-in-redis-token";

		// 해시된 값으로 조회되므로 anyString() 사용
		given(refreshTokenRepository.findByToken(anyString())).willReturn(Optional.empty());

		assertThatThrownBy(() -> memberService.refreshAccessToken(tokenNotInRedis))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_REFRESH_TOKEN);
	}

	@Test
	@DisplayName("성공: 로그아웃 시 Refresh Token 삭제 및 Access Token 블랙리스트 등록")
	void logoutSuccess() {
		// given
		String accessToken = "test-access-token";
		given(jwtTokenProvider.getExpirationSeconds(accessToken)).willReturn(1800L);

		// when
		memberService.logout(TEST_USERNAME, accessToken);

		// then
		verify(refreshTokenRepository).deleteById(TEST_USERNAME);

		ArgumentCaptor<AccessTokenBlacklist> captor = ArgumentCaptor.forClass(AccessTokenBlacklist.class);
		verify(accessTokenBlacklistRepository).save(captor.capture());
		AccessTokenBlacklist saved = captor.getValue();
		assertThat(saved.getTokenHash()).isNotEqualTo(accessToken); // 해시되어 저장
		assertThat(saved.getExpirationSeconds()).isEqualTo(1800L);
	}

	@Test
	@DisplayName("성공: 로그아웃 시 만료 임박 토큰도 블랙리스트 등록")
	void logoutWithNearExpiredToken() {
		// given
		String accessToken = "near-expired-token";
		given(jwtTokenProvider.getExpirationSeconds(accessToken)).willReturn(1L);

		// when
		memberService.logout(TEST_USERNAME, accessToken);

		// then
		verify(refreshTokenRepository).deleteById(TEST_USERNAME);
		verify(accessTokenBlacklistRepository).save(any(AccessTokenBlacklist.class));
	}
}

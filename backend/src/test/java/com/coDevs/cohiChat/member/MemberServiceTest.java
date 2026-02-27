package com.coDevs.cohiChat.member;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.coDevs.cohiChat.booking.BookingRepository;
import com.coDevs.cohiChat.booking.entity.AttendanceStatus;
import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.global.config.RateLimitService;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.global.security.jwt.JwtTokenProvider;
import com.coDevs.cohiChat.global.security.jwt.TokenService;
import com.coDevs.cohiChat.member.entity.AccessTokenBlacklist;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Provider;
import com.coDevs.cohiChat.member.entity.RefreshToken;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.member.event.MemberWithdrawalEvent;
import com.coDevs.cohiChat.member.request.LoginRequestDTO;
import com.coDevs.cohiChat.member.request.SignupRequestDTO;
import com.coDevs.cohiChat.member.request.UpdateMemberRequestDTO;
import com.coDevs.cohiChat.member.response.LoginResponseDTO;
import com.coDevs.cohiChat.member.response.RefreshTokenResponseDTO;
import com.coDevs.cohiChat.member.response.SignupResponseDTO;
import com.coDevs.cohiChat.member.response.WithdrawalCheckResponseDTO;
import com.coDevs.cohiChat.timeslot.entity.TimeSlot;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.Clock;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;

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
	private BookingRepository bookingRepository;

	@Mock
	private PasswordEncoder passwordEncoder;

	@Mock
	private JwtTokenProvider jwtTokenProvider;

	@Mock
	private TokenService tokenService;

	@Mock
	private Clock clock;

	@Mock
	private RateLimitService rateLimitService;

	@Mock
	private ApplicationEventPublisher eventPublisher;

	@InjectMocks
	private MemberService memberService;


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
	@DisplayName("성공: 로그인 성공 - TokenService.issueTokens 호출")
	void loginSuccess() {
		LoginRequestDTO loginRequestDTO = LoginRequestDTO.builder()
			.username(TEST_USERNAME)
			.password(TEST_PASSWORD)
			.build();

		LoginResponseDTO mockResponse = LoginResponseDTO.builder()
			.accessToken("test-access-token")
			.refreshToken("test-refresh-token")
			.expiredInMinutes(60L)
			.username(TEST_USERNAME)
			.displayName(TEST_DISPLAY_NAME)
			.build();

		given(memberRepository.findByUsernameAndIsDeletedFalse(TEST_USERNAME)).willReturn(Optional.of(member));
		given(passwordEncoder.matches(TEST_PASSWORD, "hashedPassword")).willReturn(true);
		given(tokenService.issueTokens(member)).willReturn(mockResponse);

		LoginResponseDTO response = memberService.login(loginRequestDTO);

		assertThat(response.getAccessToken()).isEqualTo("test-access-token");
		assertThat(response.getRefreshToken()).isEqualTo("test-refresh-token");
		verify(tokenService).issueTokens(member);
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
	@DisplayName("실패: OAuth 가입 멤버가 로컬 로그인 시도 시 SOCIAL_LOGIN_REQUIRED 반환")
	void loginFailOAuthMemberLocalLogin() {
		Member oAuthMember = Member.createOAuth(
			TEST_USERNAME, TEST_DISPLAY_NAME, TEST_EMAIL, "test-provider-id", Provider.GOOGLE, Role.GUEST
		);
		LoginRequestDTO request = LoginRequestDTO.builder()
			.username(TEST_USERNAME)
			.password(TEST_PASSWORD)
			.build();

		given(memberRepository.findByUsernameAndIsDeletedFalse(TEST_USERNAME)).willReturn(Optional.of(oAuthMember));

		assertThatThrownBy(() -> memberService.login(request))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.SOCIAL_LOGIN_REQUIRED);
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
	@DisplayName("성공: 유효한 Refresh Token으로 AT + RT 재발급 (Rotation)")
	void refreshAccessTokenSuccess() {
		String validRefreshToken = "valid-refresh-token";
		String expectedHash = "ba518c093e1e0df01cfe01436563cd37f6a1f47697fcc620e818a2d062665083";
		String newRefreshToken = "new-refresh-token";
		String newHash = "new-hash-value";
		RefreshToken storedToken = RefreshToken.create(expectedHash, TEST_USERNAME, 604800000L);

		given(jwtTokenProvider.getUsernameFromToken(validRefreshToken)).willReturn(TEST_USERNAME);
		given(tokenService.hashToken(validRefreshToken)).willReturn(expectedHash);
		given(tokenService.hashToken(newRefreshToken)).willReturn(newHash);
		given(refreshTokenRepository.findById(TEST_USERNAME)).willReturn(Optional.of(storedToken));
		given(memberRepository.findByUsernameAndIsDeletedFalse(TEST_USERNAME)).willReturn(Optional.of(member));
		given(jwtTokenProvider.createRefreshToken(TEST_USERNAME)).willReturn(newRefreshToken);
		given(jwtTokenProvider.getRefreshTokenExpirationMs()).willReturn(604800000L);
		given(jwtTokenProvider.createAccessToken(TEST_USERNAME, "GUEST")).willReturn("new-access-token");
		given(jwtTokenProvider.getExpirationSeconds("new-access-token")).willReturn(3600L);

		RefreshTokenResponseDTO response = memberService.refreshAccessToken(validRefreshToken);

		assertThat(response.getAccessToken()).isEqualTo("new-access-token");
		assertThat(response.getRefreshToken()).isEqualTo(newRefreshToken);
		assertThat(response.getExpiredInMinutes()).isEqualTo(60);
		verify(refreshTokenRepository).save(storedToken);
		assertThat(storedToken.getToken()).isEqualTo(newHash);
		assertThat(storedToken.getPreviousToken()).isEqualTo(expectedHash);
	}

	@Test
	@DisplayName("실패: 이미 사용된 RT(이전 토큰)가 Grace Window 내에 들어오면 GRACE_WINDOW_HIT 반환 (세션 유지)")
	void refreshAccessTokenGraceWindow() {
		String oldRefreshToken = "old-refresh-token";
		String oldHash = "old-hash";
		String currentHash = "current-hash";
		given(clock.millis()).willReturn(100_000L);
		
		// 이미 한 번 회전된 상태의 저장된 토큰
		RefreshToken storedToken = RefreshToken.builder()
			.username(TEST_USERNAME)
			.token(currentHash)
			.previousToken(oldHash)
			.rotatedAt(95_000L) // now(100000) - 5000
			.expiration(604800000L)
			.build();

		given(jwtTokenProvider.getUsernameFromToken(oldRefreshToken)).willReturn(TEST_USERNAME);
		given(tokenService.hashToken(oldRefreshToken)).willReturn(oldHash);
		given(refreshTokenRepository.findById(TEST_USERNAME)).willReturn(Optional.of(storedToken));

		assertThatThrownBy(() -> memberService.refreshAccessToken(oldRefreshToken))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.GRACE_WINDOW_HIT);
		
		verify(refreshTokenRepository, never()).deleteById(anyString());
	}

	@Test
	@DisplayName("실패: Grace Window 내 불일치 토큰은 세션 유지 + GRACE_WINDOW_HIT 반환")
	void refreshAccessTokenGraceWindowWithNonPreviousToken() {
		String mismatchedToken = "mismatched-token";
		String mismatchHash = "mismatch-hash";
		String currentHash = "current-hash";
		String previousHash = "previous-hash";
		given(clock.millis()).willReturn(100_000L);

		RefreshToken storedToken = RefreshToken.builder()
			.username(TEST_USERNAME)
			.token(currentHash)
			.previousToken(previousHash)
			.rotatedAt(95_000L) // now(100000) - 5000
			.expiration(604800000L)
			.build();

		given(jwtTokenProvider.getUsernameFromToken(mismatchedToken)).willReturn(TEST_USERNAME);
		given(tokenService.hashToken(mismatchedToken)).willReturn(mismatchHash);
		given(refreshTokenRepository.findById(TEST_USERNAME)).willReturn(Optional.of(storedToken));

		assertThatThrownBy(() -> memberService.refreshAccessToken(mismatchedToken))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.GRACE_WINDOW_HIT);

		verify(refreshTokenRepository, never()).deleteById(anyString());
		verify(refreshTokenRepository, never()).save(any(RefreshToken.class));
	}

	@Test
	@DisplayName("실패: 이미 사용된 RT가 Grace Window를 초과하면 세션 무효화(삭제) 처리")
	void refreshAccessTokenReuseAfterGraceWindow() {
		String oldRefreshToken = "old-refresh-token";
		String oldHash = "old-hash";
		String currentHash = "current-hash";
		given(clock.millis()).willReturn(100_000L);
		
		// 30초(Grace Window) 이상 지난 토큰
		RefreshToken storedToken = RefreshToken.builder()
			.username(TEST_USERNAME)
			.token(currentHash)
			.previousToken(oldHash)
			.rotatedAt(60_000L) // now(100000) - 40000
			.expiration(604800000L)
			.build();

		given(jwtTokenProvider.getUsernameFromToken(oldRefreshToken)).willReturn(TEST_USERNAME);
		given(tokenService.hashToken(oldRefreshToken)).willReturn(oldHash);
		given(refreshTokenRepository.findById(TEST_USERNAME)).willReturn(Optional.of(storedToken));

		assertThatThrownBy(() -> memberService.refreshAccessToken(oldRefreshToken))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_REFRESH_TOKEN);
		
		verify(refreshTokenRepository).deleteById(TEST_USERNAME);
	}

	@Test
	@DisplayName("실패: 유효하지 않은 JWT Refresh Token")
	void refreshAccessTokenFailInvalidJwt() {
		String invalidToken = "invalid-token";

		given(jwtTokenProvider.getUsernameFromToken(invalidToken)).willThrow(new JwtException("invalid"));

		assertThatThrownBy(() -> memberService.refreshAccessToken(invalidToken))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_REFRESH_TOKEN);
	}

	@Test
	@DisplayName("실패: 만료된 JWT Refresh Token은 EXPIRED_REFRESH_TOKEN 반환")
	void refreshAccessTokenFailExpiredJwt() {
		String expiredToken = "expired-token";

		given(jwtTokenProvider.getUsernameFromToken(expiredToken))
			.willThrow(new ExpiredJwtException(null, null, "expired"));

		assertThatThrownBy(() -> memberService.refreshAccessToken(expiredToken))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.EXPIRED_REFRESH_TOKEN);
	}

	@Test
	@DisplayName("실패: Redis에 존재하지 않는 Refresh Token (만료되어 삭제됨)")
	void refreshAccessTokenFailNotInRedis() {
		String tokenNotInRedis = "not-in-redis-token";

		given(jwtTokenProvider.getUsernameFromToken(tokenNotInRedis)).willReturn(TEST_USERNAME);
		given(refreshTokenRepository.findById(TEST_USERNAME)).willReturn(Optional.empty());

		assertThatThrownBy(() -> memberService.refreshAccessToken(tokenNotInRedis))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_REFRESH_TOKEN);
	}

	@Test
	@DisplayName("성공: Refresh Token 재발급 시 rate limit 체크 호출")
	void refreshAccessToken_callsRateLimitCheck() {
		String validRefreshToken = "valid-refresh-token";
		String expectedHash = "ba518c093e1e0df01cfe01436563cd37f6a1f47697fcc620e818a2d062665083";
		String newRefreshToken = "new-refresh-token";
		String newHash = "new-hash-value";
		RefreshToken storedToken = RefreshToken.create(expectedHash, TEST_USERNAME, 604800000L);

		given(jwtTokenProvider.getUsernameFromToken(validRefreshToken)).willReturn(TEST_USERNAME);
		given(tokenService.hashToken(validRefreshToken)).willReturn(expectedHash);
		given(tokenService.hashToken(newRefreshToken)).willReturn(newHash);
		given(refreshTokenRepository.findById(TEST_USERNAME)).willReturn(Optional.of(storedToken));
		given(memberRepository.findByUsernameAndIsDeletedFalse(TEST_USERNAME)).willReturn(Optional.of(member));
		given(jwtTokenProvider.createRefreshToken(TEST_USERNAME)).willReturn(newRefreshToken);
		given(jwtTokenProvider.getRefreshTokenExpirationMs()).willReturn(604800000L);
		given(jwtTokenProvider.createAccessToken(TEST_USERNAME, "GUEST")).willReturn("new-access-token");
		given(jwtTokenProvider.getExpirationSeconds("new-access-token")).willReturn(3600L);

		memberService.refreshAccessToken(validRefreshToken);

		verify(rateLimitService).checkRateLimit("refresh:" + TEST_USERNAME);
	}

	@Test
	@DisplayName("실패: Rate Limit 초과 시 RATE_LIMIT_EXCEEDED 예외")
	void refreshAccessToken_failWhenRateLimitExceeded() {
		String validRefreshToken = "valid-refresh-token";

		given(jwtTokenProvider.getUsernameFromToken(validRefreshToken)).willReturn(TEST_USERNAME);
		willThrow(new CustomException(ErrorCode.RATE_LIMIT_EXCEEDED))
			.given(rateLimitService).checkRateLimit("refresh:" + TEST_USERNAME);

		assertThatThrownBy(() -> memberService.refreshAccessToken(validRefreshToken))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.RATE_LIMIT_EXCEEDED);
	}

	@Test
	@DisplayName("실패: JWT subject가 null이면 INVALID_REFRESH_TOKEN 예외")
	void refreshAccessToken_failWhenUsernameNull() {
		String tokenWithNoSubject = "token-without-subject";

		given(jwtTokenProvider.getUsernameFromToken(tokenWithNoSubject)).willReturn(null);

		assertThatThrownBy(() -> memberService.refreshAccessToken(tokenWithNoSubject))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_REFRESH_TOKEN);

		verify(rateLimitService, never()).checkRateLimit(anyString());
	}

	@Test
	@DisplayName("성공: 로그아웃 시 Refresh Token 삭제 및 Access Token 블랙리스트 등록")
	void logoutSuccess() {
		// given
		String accessToken = "test-access-token";
		String hashedToken = "hashed-access-token";
		given(jwtTokenProvider.getExpirationSeconds(accessToken)).willReturn(1800L);
		given(tokenService.hashToken(accessToken)).willReturn(hashedToken);

		// when
		memberService.logout(TEST_USERNAME, accessToken);

		// then
		verify(refreshTokenRepository).deleteById(TEST_USERNAME);

		ArgumentCaptor<AccessTokenBlacklist> captor = ArgumentCaptor.forClass(AccessTokenBlacklist.class);
		verify(accessTokenBlacklistRepository).save(captor.capture());
		AccessTokenBlacklist saved = captor.getValue();
		assertThat(saved.getTokenHash()).isEqualTo(hashedToken);
		assertThat(saved.getExpirationSeconds()).isEqualTo(1800L);
	}

	@Test
	@DisplayName("성공: 로그아웃 시 만료 임박 토큰도 블랙리스트 등록")
	void logoutWithNearExpiredToken() {
		// given
		String accessToken = "near-expired-token";
		String hashedToken = "hashed-near-expired-token";
		given(jwtTokenProvider.getExpirationSeconds(accessToken)).willReturn(1L);
		given(tokenService.hashToken(accessToken)).willReturn(hashedToken);

		// when
		memberService.logout(TEST_USERNAME, accessToken);

		// then
		verify(refreshTokenRepository).deleteById(TEST_USERNAME);
		
		ArgumentCaptor<AccessTokenBlacklist> captor = ArgumentCaptor.forClass(AccessTokenBlacklist.class);
		verify(accessTokenBlacklistRepository).save(captor.capture());
		AccessTokenBlacklist saved = captor.getValue();
		assertThat(saved.getTokenHash()).isEqualTo(hashedToken);
	}

	@Test
	@DisplayName("성공: accessToken이 null이면 블랙리스트 등록 없이 Refresh Token만 삭제")
	void logoutWithNullAccessToken() {
		// when
		memberService.logout(TEST_USERNAME, null);

		// then
		verify(refreshTokenRepository).deleteById(TEST_USERNAME);
		verify(accessTokenBlacklistRepository, never()).save(any(AccessTokenBlacklist.class));
	}

	@Test
	@DisplayName("성공: 이미 만료된 토큰으로 로그아웃 시 블랙리스트 등록 건너뜀")
	void logoutWithExpiredToken() {
		// given
		String accessToken = "expired-token";
		willThrow(new ExpiredJwtException(null, null, "expired"))
			.given(jwtTokenProvider).getExpirationSeconds(accessToken);

		// when
		memberService.logout(TEST_USERNAME, accessToken);

		// then
		verify(refreshTokenRepository).deleteById(TEST_USERNAME);
		verify(accessTokenBlacklistRepository, never()).save(any(AccessTokenBlacklist.class));
	}

	@Test
	@DisplayName("성공: TTL이 0 이하인 토큰은 블랙리스트 등록 건너뜀")
	void logoutWithZeroTtlToken() {
		// given
		String accessToken = "zero-ttl-token";
		given(jwtTokenProvider.getExpirationSeconds(accessToken)).willReturn(0L);

		// when
		memberService.logout(TEST_USERNAME, accessToken);

		// then
		verify(refreshTokenRepository).deleteById(TEST_USERNAME);
		verify(accessTokenBlacklistRepository, never()).save(any(AccessTokenBlacklist.class));
	}

	@Test
	@DisplayName("성공: 탈퇴 확인 - 게스트 미래 예약이 있는 경우")
	void checkWithdrawalWithGuestBookings() {
		// given
		UUID guestId = UUID.randomUUID();
		UUID hostId = UUID.randomUUID();
		LocalDate futureDate = LocalDate.now().plusDays(7);

		TimeSlot mockTimeSlot = createMockTimeSlot(hostId);
		Booking mockBooking = Booking.create(mockTimeSlot, guestId, futureDate, "테스트 주제", "테스트 설명");

		given(memberRepository.findByUsernameAndIsDeletedFalse(TEST_USERNAME)).willReturn(Optional.of(member));
		given(bookingRepository.findFutureBookingsByGuestId(any(), any(LocalDate.class), any(AttendanceStatus.class)))
			.willReturn(List.of(mockBooking));

		// when
		WithdrawalCheckResponseDTO result = memberService.checkWithdrawal(TEST_USERNAME);

		// then
		assertThat(result.getAffectedBookingsCount()).isEqualTo(1);
		assertThat(result.getAffectedBookings()).hasSize(1);
		assertThat(result.getAffectedBookings().get(0).getRole()).isEqualTo("GUEST");
	}

	@Test
	@DisplayName("성공: 탈퇴 확인 - 호스트 미래 예약이 있는 경우")
	void checkWithdrawalWithHostBookings() {
		// given
		Member hostMember = Member.create(TEST_USERNAME, TEST_DISPLAY_NAME, TEST_EMAIL, "hashedPassword", Role.HOST);
		UUID hostId = UUID.randomUUID();
		UUID guestId = UUID.randomUUID();
		LocalDate futureDate = LocalDate.now().plusDays(7);

		TimeSlot mockTimeSlot = createMockTimeSlot(hostId);
		Booking mockBooking = Booking.create(mockTimeSlot, guestId, futureDate, "호스트 예약", "설명");

		given(memberRepository.findByUsernameAndIsDeletedFalse(TEST_USERNAME)).willReturn(Optional.of(hostMember));
		given(bookingRepository.findFutureBookingsByHostId(any(), any(LocalDate.class), any(AttendanceStatus.class)))
			.willReturn(List.of(mockBooking));
		given(bookingRepository.findFutureBookingsByGuestId(any(), any(LocalDate.class), any(AttendanceStatus.class)))
			.willReturn(Collections.emptyList());

		// when
		WithdrawalCheckResponseDTO result = memberService.checkWithdrawal(TEST_USERNAME);

		// then
		assertThat(result.getAffectedBookingsCount()).isEqualTo(1);
		assertThat(result.getAffectedBookings().get(0).getRole()).isEqualTo("HOST");
	}

	@Test
	@DisplayName("성공: 탈퇴 확인 - 예약이 없는 경우")
	void checkWithdrawalWithNoBookings() {
		// given
		given(memberRepository.findByUsernameAndIsDeletedFalse(TEST_USERNAME)).willReturn(Optional.of(member));
		given(bookingRepository.findFutureBookingsByGuestId(any(), any(LocalDate.class), any(AttendanceStatus.class)))
			.willReturn(Collections.emptyList());

		// when
		WithdrawalCheckResponseDTO result = memberService.checkWithdrawal(TEST_USERNAME);

		// then
		assertThat(result.getAffectedBookingsCount()).isEqualTo(0);
		assertThat(result.getAffectedBookings()).isEmpty();
	}

	@Test
	@DisplayName("성공: 예약이 없는 회원 탈퇴 시 Soft Delete, Refresh Token 삭제 및 이벤트 발행")
	void deleteMemberWithNoBookingsSuccess() {
		// given
		given(memberRepository.findByUsernameAndIsDeletedFalse(TEST_USERNAME)).willReturn(Optional.of(member));
		given(bookingRepository.findFutureBookingsByGuestId(any(), any(LocalDate.class), any(AttendanceStatus.class)))
			.willReturn(Collections.emptyList());

		// when
		memberService.deleteMember(TEST_USERNAME);

		// then
		assertThat(member.isDeleted()).isTrue();
		assertThat(member.getDeletedAt()).isNotNull();
		verify(refreshTokenRepository).deleteById(TEST_USERNAME);
		verify(eventPublisher).publishEvent(any(MemberWithdrawalEvent.class));
	}

	@Test
	@DisplayName("성공: 게스트 탈퇴 시 미래 예약이 강제 취소되고 GCal 삭제 이벤트 발행")
	void deleteMemberCancelsGuestBookings() {
		// given
		UUID guestId = UUID.randomUUID();
		UUID hostId = UUID.randomUUID();
		LocalDate futureDate = LocalDate.now().plusDays(7);

		TimeSlot mockTimeSlot = createMockTimeSlot(hostId);
		Booking mockBooking = Booking.create(mockTimeSlot, guestId, futureDate, "테스트 주제", "테스트 설명");

		given(memberRepository.findByUsernameAndIsDeletedFalse(TEST_USERNAME)).willReturn(Optional.of(member));
		given(bookingRepository.findFutureBookingsByGuestId(any(), any(LocalDate.class), any(AttendanceStatus.class)))
			.willReturn(List.of(mockBooking));

		// when
		memberService.deleteMember(TEST_USERNAME);

		// then
		assertThat(member.isDeleted()).isTrue();
		assertThat(mockBooking.getAttendanceStatus()).isEqualTo(AttendanceStatus.CANCELLED);
		assertThat(mockBooking.getCancelledReason()).isEqualTo("회원 탈퇴로 인한 취소");
		verify(refreshTokenRepository).deleteById(TEST_USERNAME);

		// GCal 삭제를 위한 이벤트 발행 검증
		ArgumentCaptor<MemberWithdrawalEvent> eventCaptor = ArgumentCaptor.forClass(MemberWithdrawalEvent.class);
		verify(eventPublisher).publishEvent(eventCaptor.capture());
		MemberWithdrawalEvent publishedEvent = eventCaptor.getValue();
		assertThat(publishedEvent.getGuestBookings()).hasSize(1);
		assertThat(publishedEvent.getMemberRole()).isEqualTo(Role.GUEST);
	}

	@Test
	@DisplayName("성공: 호스트 탈퇴 시 호스트로서의 미래 예약도 강제 취소되고 GCal 삭제 이벤트 발행")
	void deleteMemberCancelsHostBookings() {
		// given
		Member hostMember = Member.create(TEST_USERNAME, TEST_DISPLAY_NAME, TEST_EMAIL, "hashedPassword", Role.HOST);
		UUID hostId = UUID.randomUUID();
		UUID guestId = UUID.randomUUID();
		LocalDate futureDate = LocalDate.now().plusDays(7);

		TimeSlot mockTimeSlot = createMockTimeSlot(hostId);
		Booking hostBooking = Booking.create(mockTimeSlot, guestId, futureDate, "호스트 예약", "설명");

		given(memberRepository.findByUsernameAndIsDeletedFalse(TEST_USERNAME)).willReturn(Optional.of(hostMember));
		given(bookingRepository.findFutureBookingsByHostId(any(), any(LocalDate.class), any(AttendanceStatus.class)))
			.willReturn(List.of(hostBooking));
		given(bookingRepository.findFutureBookingsByGuestId(any(), any(LocalDate.class), any(AttendanceStatus.class)))
			.willReturn(Collections.emptyList());

		// when
		memberService.deleteMember(TEST_USERNAME);

		// then
		assertThat(hostMember.isDeleted()).isTrue();
		assertThat(hostBooking.getAttendanceStatus()).isEqualTo(AttendanceStatus.CANCELLED);
		assertThat(hostBooking.getCancelledReason()).isEqualTo("회원 탈퇴로 인한 취소");
		verify(refreshTokenRepository).deleteById(TEST_USERNAME);

		// GCal 삭제를 위한 이벤트 발행 검증
		ArgumentCaptor<MemberWithdrawalEvent> eventCaptor = ArgumentCaptor.forClass(MemberWithdrawalEvent.class);
		verify(eventPublisher).publishEvent(eventCaptor.capture());
		MemberWithdrawalEvent publishedEvent = eventCaptor.getValue();
		assertThat(publishedEvent.getHostBookings()).hasSize(1);
		assertThat(publishedEvent.getMemberRole()).isEqualTo(Role.HOST);
	}

	private TimeSlot createMockTimeSlot(UUID userId) {
		return TimeSlot.create(
			userId,
			LocalTime.of(10, 0),
			LocalTime.of(11, 0),
			List.of(1, 2, 3, 4, 5)
		);
	}
}

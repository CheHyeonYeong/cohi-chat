package com.coDevs.cohiChat.member;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;

import com.coDevs.cohiChat.booking.BookingRepository;
import com.coDevs.cohiChat.booking.entity.AttendanceStatus;
import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.member.event.MemberWithdrawalEvent;
import com.coDevs.cohiChat.member.response.WithdrawalCheckResponseDTO;
import com.coDevs.cohiChat.timeslot.entity.TimeSlot;

import org.springframework.context.ApplicationEventPublisher;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.mockito.ArgumentCaptor;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.coDevs.cohiChat.global.config.RateLimitService;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.global.security.jwt.JwtTokenProvider;
import com.coDevs.cohiChat.global.security.jwt.TokenService;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Provider;
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
	private BookingRepository bookingRepository;

	@Mock
	private PasswordEncoder passwordEncoder;

	@Mock
	private JwtTokenProvider jwtTokenProvider;

	@Mock
	private TokenService tokenService;

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
	@DisplayName("실패: OAuth 가입 멤버가 로컬 로그인 시도 시 PASSWORD_MISMATCH 반환")
	void loginFailOAuthMemberLocalLogin() {
		Member oAuthMember = Member.createOAuth(
			TEST_USERNAME, TEST_DISPLAY_NAME, TEST_EMAIL, Provider.GOOGLE, Role.GUEST
		);
		LoginRequestDTO request = LoginRequestDTO.builder()
			.username(TEST_USERNAME)
			.password(TEST_PASSWORD)
			.build();

		given(memberRepository.findByUsernameAndIsDeletedFalse(TEST_USERNAME)).willReturn(Optional.of(oAuthMember));
		given(passwordEncoder.matches(TEST_PASSWORD, null)).willReturn(false);

		assertThatThrownBy(() -> memberService.login(request))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.PASSWORD_MISMATCH);
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

		given(jwtTokenProvider.getUsernameFromToken(validRefreshToken)).willReturn(TEST_USERNAME);
		given(tokenService.hashToken(validRefreshToken)).willReturn(expectedHash);
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
		given(tokenService.hashToken(tokenNotInRedis)).willReturn("some-hash");
		given(refreshTokenRepository.findByToken(anyString())).willReturn(Optional.empty());

		assertThatThrownBy(() -> memberService.refreshAccessToken(tokenNotInRedis))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_REFRESH_TOKEN);
	}

	@Test
	@DisplayName("성공: Refresh Token 재발급 시 rate limit 체크 호출")
	void refreshAccessToken_callsRateLimitCheck() {
		String validRefreshToken = "valid-refresh-token";
		String expectedHash = "ba518c093e1e0df01cfe01436563cd37f6a1f47697fcc620e818a2d062665083";
		RefreshToken storedToken = RefreshToken.create(expectedHash, TEST_USERNAME, 604800000L);

		given(jwtTokenProvider.getUsernameFromToken(validRefreshToken)).willReturn(TEST_USERNAME);
		given(tokenService.hashToken(validRefreshToken)).willReturn(expectedHash);
		given(refreshTokenRepository.findByToken(expectedHash)).willReturn(Optional.of(storedToken));
		given(memberRepository.findByUsernameAndIsDeletedFalse(TEST_USERNAME)).willReturn(Optional.of(member));
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
	@DisplayName("성공: 로그아웃 시 Refresh Token 삭제")
	void logoutSuccess() {
		// when
		memberService.logout(TEST_USERNAME);

		// then
		verify(refreshTokenRepository).deleteById(TEST_USERNAME);
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

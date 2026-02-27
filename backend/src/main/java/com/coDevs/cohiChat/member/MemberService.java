package com.coDevs.cohiChat.member;

import com.coDevs.cohiChat.booking.BookingRepository;
import com.coDevs.cohiChat.booking.HostChatCount;
import com.coDevs.cohiChat.booking.entity.AttendanceStatus;
import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.global.security.jwt.JwtTokenProvider;
import com.coDevs.cohiChat.global.security.jwt.TokenService;
import com.coDevs.cohiChat.member.entity.AccessTokenBlacklist;
import com.coDevs.cohiChat.member.entity.RefreshToken;
import com.coDevs.cohiChat.member.entity.Provider;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.member.event.MemberWithdrawalEvent;
import com.coDevs.cohiChat.member.request.LoginRequestDTO;
import com.coDevs.cohiChat.member.request.SignupRequestDTO;
import com.coDevs.cohiChat.member.request.UpdateMemberRequestDTO;
import com.coDevs.cohiChat.member.request.UpdateProfileRequestDTO;
import com.coDevs.cohiChat.member.response.LoginResponseDTO;
import com.coDevs.cohiChat.member.response.MemberResponseDTO;
import com.coDevs.cohiChat.member.response.RefreshTokenResponseDTO;
import com.coDevs.cohiChat.member.response.SignupResponseDTO;
import com.coDevs.cohiChat.member.response.HostResponseDTO;
import com.coDevs.cohiChat.member.response.WithdrawalCheckResponseDTO;
import com.coDevs.cohiChat.member.response.WithdrawalCheckResponseDTO.AffectedBookingDTO;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;

import com.coDevs.cohiChat.global.config.RateLimitService;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.global.util.SmtpEmailValidator;
import com.coDevs.cohiChat.global.util.TokenHashUtil;
import com.coDevs.cohiChat.member.entity.Member;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.apache.commons.text.RandomStringGenerator;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class MemberService {

	private final MemberRepository memberRepository;
	private final RefreshTokenRepository refreshTokenRepository;
	private final AccessTokenBlacklistRepository accessTokenBlacklistRepository;
	private final BookingRepository bookingRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtTokenProvider jwtTokenProvider;
	private final RateLimitService rateLimitService;
	private final TokenService tokenService;
	private final ApplicationEventPublisher eventPublisher;
	private final SmtpEmailValidator smtpEmailValidator;

	@Transactional
	public SignupResponseDTO signup(SignupRequestDTO request){

		validateDuplicate(request.getUsername(), request.getEmail());

		String displayName = (request.getDisplayName() == null || request.getDisplayName().isBlank())
			? generateDefaultDisplayName() : request.getDisplayName();

		Role role = (request.getRole() != null) ? request.getRole() : Role.GUEST;

		String encodedPassword = passwordEncoder.encode(request.getPassword());

		Member member = Member.create(
			request.getUsername(),
			displayName,
			request.getEmail().toLowerCase(),
			encodedPassword,
			role
		);

		memberRepository.save(member);

		// 비동기 SMTP 이메일 검증 (fire-and-forget, 가입 차단하지 않음)
		smtpEmailValidator.validateEmailExists(member.getEmail())
			.thenAccept(valid -> {
				if (!valid) {
					log.warn("SMTP validation failed for email: {}", member.getEmail());
				}
			});

		return new SignupResponseDTO(
			member.getId(),
			member.getUsername(),
			member.getDisplayName()
		);
	}

	private void validateDuplicate(String username, String email) {

		if (memberRepository.existsByUsernameAndIsDeletedFalse(username)) {
			throw new CustomException(ErrorCode.DUPLICATED_USERNAME);
		}
		if (memberRepository.existsByEmail(email.toLowerCase())) {
			throw new CustomException(ErrorCode.DUPLICATED_EMAIL);
		}
	}

	private String generateDefaultDisplayName() {

		return new RandomStringGenerator.Builder()
			.withinRange('0', 'z')
			.filteredBy(Character::isLetterOrDigit)
			.build()
			.generate(8);
	}

	@Transactional
	public LoginResponseDTO login(LoginRequestDTO request){
		Member member = memberRepository.findByUsernameAndIsDeletedFalse(request.getUsername())
			.orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

		if (member.getProvider() != Provider.LOCAL) {
			throw new CustomException(ErrorCode.SOCIAL_LOGIN_REQUIRED);
		}
		if (!passwordEncoder.matches(request.getPassword(), member.getHashedPassword())) {
			throw new CustomException(ErrorCode.PASSWORD_MISMATCH);
		}

		return tokenService.issueTokens(member);
	}

	public Member getMember(String username) {

		return memberRepository.findByUsernameAndIsDeletedFalse(username)
			.orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
	}

	/**
	 * 사용자 조회 (Optional 반환).
	 * 공개 API에서 사용자 열거 방지가 필요한 경우 사용.
	 */
	public Optional<Member> findMember(String username) {
		return memberRepository.findByUsernameAndIsDeletedFalse(username);
	}

	@Transactional
	public MemberResponseDTO updateMember(String username, UpdateMemberRequestDTO request) {

		if ((request.getDisplayName() == null || request.getDisplayName().isBlank())
			&& (request.getPassword() == null || request.getPassword().isBlank())) {
			throw new CustomException(ErrorCode.NO_UPDATE_FIELDS);
		}

		Member member = getMember(username);

		String hashPw = (request.getPassword() != null && !request.getPassword().isBlank())
			? passwordEncoder.encode(request.getPassword()) : null;

		member.updateInfo(request.getDisplayName(), hashPw);

		return MemberResponseDTO.from(member);
	}

	/**
	 * 회원 탈퇴 처리.
	 * DB 트랜잭션 커밋 후 이벤트 리스너에서 Google Calendar 이벤트를 삭제하여 일관성 보장.
	 */
	@Transactional
	public void deleteMember(String username) {
		Member member = getMember(username);
		LocalDate today = LocalDate.now();

		// 1. 미래 예약 조회 (GCal 삭제 이벤트용)
		List<Booking> hostBookings = findFutureHostBookings(member, today);
		List<Booking> guestBookings = findFutureGuestBookings(member, today);

		// 2. 예약 취소 처리
		String cancellationReason = "회원 탈퇴로 인한 취소";
		hostBookings.forEach(booking -> booking.forceCancel(cancellationReason));
		guestBookings.forEach(booking -> booking.forceCancel(cancellationReason));

		// 3. 회원 soft delete 및 refresh token 삭제
		member.softDelete();
		refreshTokenRepository.deleteById(username);

		// 4. 트랜잭션 커밋 후 GCal 이벤트 삭제를 위한 이벤트 발행
		eventPublisher.publishEvent(new MemberWithdrawalEvent(
			member.getId(),
			member.getRole(),
			hostBookings,
			guestBookings,
			today
		));
	}

	/**
	 * 회원 탈퇴 시 영향받는 예약 조회
	 * @param username 사용자명
	 * @return 영향받는 예약 목록
	 */
	@Transactional(readOnly = true)
	public WithdrawalCheckResponseDTO checkWithdrawal(String username) {
		Member member = getMember(username);
		LocalDate today = LocalDate.now();
		List<AffectedBookingDTO> affectedBookings = new ArrayList<>();

		// 호스트인 경우: 호스트로서의 미래 예약 조회
		findFutureHostBookings(member, today)
			.forEach(booking -> affectedBookings.add(toAffectedBookingDTO(booking, "HOST")));

		// 모든 사용자: 게스트로서의 미래 예약 조회
		findFutureGuestBookings(member, today)
			.forEach(booking -> affectedBookings.add(toAffectedBookingDTO(booking, "GUEST")));

		return WithdrawalCheckResponseDTO.of(affectedBookings);
	}

	private AffectedBookingDTO toAffectedBookingDTO(Booking booking, String role) {
		return AffectedBookingDTO.builder()
			.bookingId(booking.getId())
			.bookingDate(booking.getBookingDate())
			.startTime(booking.getTimeSlot().getStartTime())
			.endTime(booking.getTimeSlot().getEndTime())
			.topic(booking.getTopic())
			.role(role)
			.build();
	}

	private List<Booking> findFutureHostBookings(Member member, LocalDate today) {
		if (member.getRole() != Role.HOST) {
			return Collections.emptyList();
		}
		return bookingRepository.findFutureBookingsByHostId(
			member.getId(), today, AttendanceStatus.SCHEDULED);
	}

	private List<Booking> findFutureGuestBookings(Member member, LocalDate today) {
		return bookingRepository.findFutureBookingsByGuestId(
			member.getId(), today, AttendanceStatus.SCHEDULED);
	}

	@Transactional(readOnly = true)
	public List<HostResponseDTO> getActiveHosts() {
		List<Member> hosts = memberRepository.findByRoleAndIsDeletedFalse(Role.HOST);
		if (hosts.isEmpty()) return List.of();
		List<UUID> hostIds = hosts.stream().map(Member::getId).toList();
		Map<UUID, Long> chatCounts = bookingRepository
			.countAttendedByHostIds(hostIds, AttendanceStatus.ATTENDED)
			.stream()
			.collect(Collectors.toMap(HostChatCount::getHostId, HostChatCount::getCount));
		return hosts.stream()
			.map(h -> HostResponseDTO.from(h, chatCounts.getOrDefault(h.getId(), 0L)))
			.toList();
	}

	@Transactional
	public HostResponseDTO updateProfile(String username, UpdateProfileRequestDTO req) {
		Member member = getMember(username);
		member.updateProfile(req.getJob(), req.getProfileImageUrl());
		long chatCount = bookingRepository
			.countAttendedByHostIds(List.of(member.getId()), AttendanceStatus.ATTENDED)
			.stream()
			.findFirst()
			.map(HostChatCount::getCount)
			.orElse(0L);
		return HostResponseDTO.from(member, chatCount);
	}

	public void logout(String username, String accessToken) {
		refreshTokenRepository.deleteById(username);

		try {
			long remainingSeconds = jwtTokenProvider.getExpirationSeconds(accessToken);
			if (remainingSeconds <= 0) {
				return;
			}
			String tokenHash = TokenHashUtil.hash(accessToken);
			AccessTokenBlacklist blacklist = AccessTokenBlacklist.create(tokenHash, remainingSeconds);
			accessTokenBlacklistRepository.save(blacklist);
		} catch (ExpiredJwtException e) {
			log.debug("이미 만료된 토큰, 블랙리스트 등록 생략: {}", e.getMessage());
		} catch (Exception e) {
			log.warn("Access Token 블랙리스트 등록 실패 (best-effort): {}", e.getMessage());
		}
	}

	@Transactional
	public RefreshTokenResponseDTO refreshAccessToken(String refreshTokenValue) {
		// 1. JWT 검증 + username 추출 (만료 vs 위조 구분)
		String verifiedUsername;
		try {
			verifiedUsername = jwtTokenProvider.getUsernameFromToken(refreshTokenValue);
		} catch (ExpiredJwtException e) {
			throw new CustomException(ErrorCode.EXPIRED_REFRESH_TOKEN);
		} catch (JwtException | IllegalArgumentException e) {
			throw new CustomException(ErrorCode.INVALID_REFRESH_TOKEN);
		}

		// 2. username 유효성 확인 후 Rate Limit 체크
		if (verifiedUsername == null || verifiedUsername.isBlank()) {
			throw new CustomException(ErrorCode.INVALID_REFRESH_TOKEN);
		}
		rateLimitService.checkRateLimit("refresh:" + verifiedUsername);

		// 3. Redis에서 해시된 토큰으로 존재 확인 (만료된 토큰은 Redis TTL로 자동 삭제됨)
		String tokenHash = tokenService.hashToken(refreshTokenValue);
		refreshTokenRepository.findByToken(tokenHash)
			.orElseThrow(() -> new CustomException(ErrorCode.INVALID_REFRESH_TOKEN));

		// 4. 사용자 정보 조회
		Member member = memberRepository.findByUsernameAndIsDeletedFalse(verifiedUsername)
			.orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

		// 5. RT Rotation: 기존 RT 삭제 + 새 RT 발급
		refreshTokenRepository.deleteById(member.getUsername());
		String newRefreshTokenValue = jwtTokenProvider.createRefreshToken(member.getUsername());
		long refreshTokenExpirationMs = jwtTokenProvider.getRefreshTokenExpirationMs();
		RefreshToken newRefreshToken = RefreshToken.create(
			TokenHashUtil.hash(newRefreshTokenValue), member.getUsername(), refreshTokenExpirationMs
		);
		refreshTokenRepository.save(newRefreshToken);

		// 6. 새 AT 발급
		String newAccessToken = jwtTokenProvider.createAccessToken(
			member.getUsername(), member.getRole().name()
		);
		long expiredInSeconds = jwtTokenProvider.getExpirationSeconds(newAccessToken);

		return RefreshTokenResponseDTO.builder()
			.accessToken(newAccessToken)
			.refreshToken(newRefreshTokenValue)
			.expiredInMinutes((long) Math.ceil((double) expiredInSeconds / 60))
			.build();
	}
}

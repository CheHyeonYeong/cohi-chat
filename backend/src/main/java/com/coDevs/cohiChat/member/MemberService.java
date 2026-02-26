package com.coDevs.cohiChat.member;

import com.coDevs.cohiChat.booking.BookingRepository;
import com.coDevs.cohiChat.booking.entity.AttendanceStatus;
import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.global.security.jwt.JwtTokenProvider;
import com.coDevs.cohiChat.global.security.jwt.TokenService;
import com.coDevs.cohiChat.member.entity.AccessTokenBlacklist;
import com.coDevs.cohiChat.member.entity.RefreshToken;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.member.event.MemberWithdrawalEvent;
import com.coDevs.cohiChat.member.request.LoginRequestDTO;
import com.coDevs.cohiChat.member.request.SignupRequestDTO;
import com.coDevs.cohiChat.member.request.UpdateMemberRequestDTO;
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
import java.util.Optional;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;

import com.coDevs.cohiChat.global.config.RateLimitService;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
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

        private static final long RT_GRACE_WINDOW_MS = 30000; // 30 seconds

        private final MemberRepository memberRepository;
        private final RefreshTokenRepository refreshTokenRepository;
        private final AccessTokenBlacklistRepository accessTokenBlacklistRepository;
        private final BookingRepository bookingRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtTokenProvider jwtTokenProvider;
        private final RateLimitService rateLimitService;
        private final TokenService tokenService;
        private final ApplicationEventPublisher eventPublisher;

        @Transactional
        public SignupResponseDTO signup(SignupRequestDTO request){
                validateDuplicate(request.getUsername(), request.getEmail());
                String displayName = (request.getDisplayName() == null || request.getDisplayName().isBlank())
                        ? generateDefaultDisplayName() : request.getDisplayName();
                Role role = (request.getRole() != null) ? request.getRole() : Role.GUEST;
                String encodedPassword = passwordEncoder.encode(request.getPassword());
                Member member = Member.create(request.getUsername(), displayName, request.getEmail().toLowerCase(), encodedPassword, role);
                memberRepository.save(member);
                return new SignupResponseDTO(member.getId(), member.getUsername(), member.getDisplayName());
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
                if (!passwordEncoder.matches(request.getPassword(), member.getHashedPassword())) {
                        throw new CustomException(ErrorCode.PASSWORD_MISMATCH);
                }
                return tokenService.issueTokens(member);
        }

        public Member getMember(String username) {
                return memberRepository.findByUsernameAndIsDeletedFalse(username)
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        }

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

        @Transactional
        public void deleteMember(String username) {
                Member member = getMember(username);
                LocalDate today = LocalDate.now();
                List<Booking> hostBookings = findFutureHostBookings(member, today);
                List<Booking> guestBookings = findFutureGuestBookings(member, today);
                String cancellationReason = "?? ??? ?? ??";
                hostBookings.forEach(booking -> booking.forceCancel(cancellationReason));
                guestBookings.forEach(booking -> booking.forceCancel(cancellationReason));
                member.softDelete();
                refreshTokenRepository.deleteById(username);
                eventPublisher.publishEvent(new MemberWithdrawalEvent(member.getId(), member.getRole(), hostBookings, guestBookings, today));
        }

        @Transactional(readOnly = true)
        public WithdrawalCheckResponseDTO checkWithdrawal(String username) {
                Member member = getMember(username);
                LocalDate today = LocalDate.now();
                List<AffectedBookingDTO> affectedBookings = new ArrayList<>();
                findFutureHostBookings(member, today).forEach(booking -> affectedBookings.add(toAffectedBookingDTO(booking, "HOST")));
                findFutureGuestBookings(member, today).forEach(booking -> affectedBookings.add(toAffectedBookingDTO(booking, "GUEST")));
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
                if (member.getRole() != Role.HOST) return Collections.emptyList();
                return bookingRepository.findFutureBookingsByHostId(member.getId(), today, AttendanceStatus.SCHEDULED);
        }

        private List<Booking> findFutureGuestBookings(Member member, LocalDate today) {
                return bookingRepository.findFutureBookingsByGuestId(member.getId(), today, AttendanceStatus.SCHEDULED);
        }

        @Transactional(readOnly = true)
        public List<HostResponseDTO> getActiveHosts() {
                return memberRepository.findByRoleAndIsDeletedFalse(Role.HOST).stream().map(HostResponseDTO::from).toList();
        }

        public void logout(String username, String accessToken) {
                refreshTokenRepository.deleteById(username);
                try {
                        long remainingSeconds = jwtTokenProvider.getExpirationSeconds(accessToken);
                        if (remainingSeconds <= 0) return;
                        String tokenHash = tokenService.hashToken(accessToken);
                        AccessTokenBlacklist blacklist = AccessTokenBlacklist.create(tokenHash, remainingSeconds);
                        accessTokenBlacklistRepository.save(blacklist);
                } catch (ExpiredJwtException e) {
                        log.debug("?? ??? ??, ????? ?? ??: {}", e.getMessage());
                } catch (Exception e) {
                        log.warn("Access Token ????? ?? ?? (best-effort): {}", e.getMessage());
                }
        }

        @Transactional
        public RefreshTokenResponseDTO refreshAccessToken(String refreshTokenValue) {
                String verifiedUsername;
                try {
                        verifiedUsername = jwtTokenProvider.getUsernameFromToken(refreshTokenValue);
                } catch (ExpiredJwtException e) {
                        throw new CustomException(ErrorCode.EXPIRED_REFRESH_TOKEN);
                } catch (JwtException | IllegalArgumentException e) {
                        throw new CustomException(ErrorCode.INVALID_REFRESH_TOKEN);
                }

                if (verifiedUsername == null || verifiedUsername.isBlank()) {
                        throw new CustomException(ErrorCode.INVALID_REFRESH_TOKEN);
                }
                rateLimitService.checkRateLimit("refresh:" + verifiedUsername);

                String tokenHash = tokenService.hashToken(refreshTokenValue);
                Optional<RefreshToken> storedTokenOpt = refreshTokenRepository.findById(verifiedUsername);

                if (storedTokenOpt.isEmpty()) {
                        throw new CustomException(ErrorCode.INVALID_REFRESH_TOKEN);
                }

                RefreshToken storedToken = storedTokenOpt.get();
                if (!storedToken.getToken().equals(tokenHash)) {
                        if (tokenHash.equals(storedToken.getPreviousToken()) &&
                                storedToken.getRotatedAt() != null &&
                                (System.currentTimeMillis() - storedToken.getRotatedAt() < RT_GRACE_WINDOW_MS)) {
                                log.info("Refresh Token grace window hit: username={}", verifiedUsername);
                                throw new CustomException(ErrorCode.INVALID_REFRESH_TOKEN);
                        }
                        log.warn("?? ??? ?? - ?? ?? ?? ???: username={}, tokenHash={}", verifiedUsername, tokenHash);
                        refreshTokenRepository.deleteById(verifiedUsername);
                        throw new CustomException(ErrorCode.INVALID_REFRESH_TOKEN);
                }

                Member member = memberRepository.findByUsernameAndIsDeletedFalse(verifiedUsername)
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

                String newRefreshTokenValue = jwtTokenProvider.createRefreshToken(member.getUsername());
                long refreshTokenExpirationMs = jwtTokenProvider.getRefreshTokenExpirationMs();
                storedToken.rotate(tokenService.hashToken(newRefreshTokenValue), refreshTokenExpirationMs);
                refreshTokenRepository.save(storedToken);

                String newAccessToken = jwtTokenProvider.createAccessToken(member.getUsername(), member.getRole().name());
                long expiredInSeconds = jwtTokenProvider.getExpirationSeconds(newAccessToken);

                return RefreshTokenResponseDTO.builder()
                        .accessToken(newAccessToken)
                        .refreshToken(newRefreshTokenValue)
                        .expiredInMinutes(expiredInSeconds / 60)
                        .build();
        }
}

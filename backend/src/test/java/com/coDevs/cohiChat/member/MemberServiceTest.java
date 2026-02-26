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
import com.coDevs.cohiChat.member.entity.AccessTokenBlacklist;
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
        @DisplayName("??: ?? ?? ??? ???? ?? ??")
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
        @DisplayName("??: ?? id? ???? ??")
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
        @DisplayName("??: ??? ?? - TokenService.issueTokens ??")
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
                verify(tokenService).issueTokens(member);
        }

        @Test
        @DisplayName("??: ??? Refresh Token?? AT + RT ??? (Rotation)")
        void refreshAccessTokenSuccess() {
                String validRefreshToken = "valid-refresh-token";
                String expectedHash = "ba518c093e1e0df01cfe01436563cd37f6a1f47697fcc620e818a2d062665083";
                RefreshToken storedToken = RefreshToken.create(expectedHash, TEST_USERNAME, 604800000L);

                given(jwtTokenProvider.getUsernameFromToken(validRefreshToken)).willReturn(TEST_USERNAME);
                given(tokenService.hashToken(validRefreshToken)).willReturn(expectedHash);
                given(refreshTokenRepository.findById(TEST_USERNAME)).willReturn(Optional.of(storedToken));
                given(memberRepository.findByUsernameAndIsDeletedFalse(TEST_USERNAME)).willReturn(Optional.of(member));
                given(jwtTokenProvider.createRefreshToken(TEST_USERNAME)).willReturn("new-refresh-token");
                given(jwtTokenProvider.getRefreshTokenExpirationMs()).willReturn(604800000L);
                given(jwtTokenProvider.createAccessToken(TEST_USERNAME, "GUEST")).willReturn("new-access-token");
                given(jwtTokenProvider.getExpirationSeconds("new-access-token")).willReturn(3600L);

                RefreshTokenResponseDTO response = memberService.refreshAccessToken(validRefreshToken);

                assertThat(response.getAccessToken()).isEqualTo("new-access-token");
                assertThat(response.getRefreshToken()).isEqualTo("new-refresh-token");
                
                verify(refreshTokenRepository).save(storedToken);
                assertThat(storedToken.getToken()).isNotEqualTo(expectedHash);
                assertThat(storedToken.getPreviousToken()).isEqualTo(expectedHash);
        }

        @Test
        @DisplayName("??: ?? Rotation? RT ??? ?? ? ?? ?? ??? ? ?? (Grace window ??)")
        void refreshAccessToken_detectedReuseInvalidatesCurrentSession() {
                String reusedToken = "already-rotated-refresh-token";
                String oldHash = "old-hash";
                String currentHash = "current-hash";
                
                long rotatedAt = System.currentTimeMillis() - 31000;
                RefreshToken storedToken = RefreshToken.builder()
                        .username(TEST_USERNAME)
                        .token(currentHash)
                        .previousToken(oldHash)
                        .rotatedAt(rotatedAt)
                        .build();

                given(jwtTokenProvider.getUsernameFromToken(reusedToken)).willReturn(TEST_USERNAME);
                given(tokenService.hashToken(reusedToken)).willReturn(oldHash);
                given(refreshTokenRepository.findById(TEST_USERNAME)).willReturn(Optional.of(storedToken));

                assertThatThrownBy(() -> memberService.refreshAccessToken(reusedToken))
                        .isInstanceOf(CustomException.class)
                        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_REFRESH_TOKEN);

                verify(refreshTokenRepository).deleteById(TEST_USERNAME);
                verify(refreshTokenRepository, never()).save(any(RefreshToken.class));
        }

        @Test
        @DisplayName("??: Grace window ?? ??? ?? ? ?? ???? ?? (?? ?? ??)")
        void refreshAccessToken_graceWindowAllowsLegitimateRetry() {
                String retryToken = "recently-rotated-token";
                String oldHash = "old-hash";
                String currentHash = "current-hash";
                
                long rotatedAt = System.currentTimeMillis() - 5000;
                RefreshToken storedToken = RefreshToken.builder()
                        .username(TEST_USERNAME)
                        .token(currentHash)
                        .previousToken(oldHash)
                        .rotatedAt(rotatedAt)
                        .build();

                given(jwtTokenProvider.getUsernameFromToken(retryToken)).willReturn(TEST_USERNAME);
                given(tokenService.hashToken(retryToken)).willReturn(oldHash);
                given(refreshTokenRepository.findById(TEST_USERNAME)).willReturn(Optional.of(storedToken));

                assertThatThrownBy(() -> memberService.refreshAccessToken(retryToken))
                        .isInstanceOf(CustomException.class)
                        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_REFRESH_TOKEN);

                verify(refreshTokenRepository, never()).deleteById(TEST_USERNAME);
                verify(refreshTokenRepository, never()).save(any(RefreshToken.class));
        }

        @Test
        @DisplayName("??: ???? ? Refresh Token ?? ? Access Token ????? ??")
        void logoutSuccess() {
                String accessToken = "test-access-token";
                given(jwtTokenProvider.getExpirationSeconds(accessToken)).willReturn(1800L);

                memberService.logout(TEST_USERNAME, accessToken);

                verify(refreshTokenRepository).deleteById(TEST_USERNAME);
                verify(accessTokenBlacklistRepository).save(any(AccessTokenBlacklist.class));
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

package com.coDevs.cohiChat.oauth;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.global.security.jwt.JwtTokenProvider;
import com.coDevs.cohiChat.global.util.TokenHashUtil;
import com.coDevs.cohiChat.member.MemberRepository;
import com.coDevs.cohiChat.member.RefreshTokenRepository;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.RefreshToken;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.member.response.LoginResponseDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OAuthMemberService {

	private final MemberRepository memberRepository;
	private final RefreshTokenRepository refreshTokenRepository;
	private final JwtTokenProvider jwtTokenProvider;

	/**
	 * OAuth 로그인 처리: 기존 회원이면 토큰만 재발급, 신규면 자동 가입 후 발급.
	 * 소프트 삭제된 계정이 동일 OAuth로 재가입 시 계정을 복구합니다.
	 * 의도적 설계: 재로그인 시 소셜 프로필(displayName 등) 변경 사항은 동기화하지 않음.
	 * 사용자가 앱 내에서 PATCH /members/v1/me/profile 로 직접 프로필을 관리할 수 있음.
	 */
	@Transactional
	public LoginResponseDTO findOrRegisterAndIssueTokens(OAuthUserInfo userInfo) {
		validateUserInfo(userInfo);

		Member member = memberRepository.findByEmailAndProviderAndIsDeletedFalse(
			userInfo.getEmail(), userInfo.getProvider()
		).orElseGet(() -> findDeletedOrRegister(userInfo));

		return issueTokens(member);
	}

	private void validateUserInfo(OAuthUserInfo userInfo) {
		if (userInfo.getEmail() == null || userInfo.getEmail().isBlank()) {
			throw new CustomException(ErrorCode.INVALID_EMAIL);
		}
		if (userInfo.getProviderId() == null || userInfo.getProviderId().isBlank()) {
			throw new CustomException(ErrorCode.INVALID_PROVIDER);
		}
	}

	private Member findDeletedOrRegister(OAuthUserInfo userInfo) {
		return memberRepository.findByEmailAndProvider(userInfo.getEmail(), userInfo.getProvider())
			.map(deletedMember -> {
				deletedMember.restore();
				return memberRepository.save(deletedMember);
			})
			.orElseGet(() -> registerNewMember(userInfo));
	}

	private Member registerNewMember(OAuthUserInfo userInfo) {
		String username = userInfo.getProvider().name().toLowerCase() + "_" + userInfo.getProviderId();
		String displayName = (userInfo.getDisplayName() != null && !userInfo.getDisplayName().isBlank())
			? userInfo.getDisplayName() : username;

		Member member = Member.createOAuth(
			username,
			displayName,
			userInfo.getEmail(),
			userInfo.getProvider(),
			Role.GUEST
		);

		return memberRepository.save(member);
	}

	private LoginResponseDTO issueTokens(Member member) {
		String accessToken = jwtTokenProvider.createAccessToken(
			member.getUsername(), member.getRole().name()
		);

		refreshTokenRepository.deleteById(member.getUsername());

		String refreshTokenValue = jwtTokenProvider.createRefreshToken(member.getUsername());
		long refreshTokenExpirationMs = jwtTokenProvider.getRefreshTokenExpirationMs();
		String refreshTokenHash = TokenHashUtil.hash(refreshTokenValue);
		RefreshToken refreshToken = RefreshToken.create(
			refreshTokenHash, member.getUsername(), refreshTokenExpirationMs
		);
		refreshTokenRepository.save(refreshToken);

		long expiredInSeconds = jwtTokenProvider.getExpirationSeconds(accessToken);

		return LoginResponseDTO.builder()
			.accessToken(accessToken)
			.expiredInMinutes((long) Math.ceil((double) expiredInSeconds / 60))
			.refreshToken(refreshTokenValue)
			.username(member.getUsername())
			.displayName(member.getDisplayName())
			.build();
	}

}

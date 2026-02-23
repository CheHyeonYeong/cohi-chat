package com.coDevs.cohiChat.oauth;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.global.common.TokenHashUtils;
import com.coDevs.cohiChat.global.security.jwt.JwtTokenProvider;
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
	 * 의도적 설계: 재로그인 시 소셜 프로필(displayName 등) 변경 사항은 동기화하지 않음.
	 * 사용자가 앱 내에서 PATCH /members/v1/me/profile 로 직접 프로필을 관리할 수 있음.
	 */
	@Transactional
	public LoginResponseDTO findOrRegisterAndIssueTokens(OAuthUserInfo userInfo) {
		Member member = memberRepository.findByEmailAndProviderAndIsDeletedFalse(
			userInfo.getEmail(), userInfo.getProvider()
		).orElseGet(() -> registerNewMember(userInfo));

		return issueTokens(member);
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
		String refreshTokenHash = TokenHashUtils.hash(refreshTokenValue);
		RefreshToken refreshToken = RefreshToken.create(
			refreshTokenHash, member.getUsername(), refreshTokenExpirationMs
		);
		refreshTokenRepository.save(refreshToken);

		long expiredInSeconds = jwtTokenProvider.getExpirationSeconds(accessToken);

		return LoginResponseDTO.builder()
			.accessToken(accessToken)
			.expiredInMinutes(expiredInSeconds / 60)
			.refreshToken(refreshTokenValue)
			.username(member.getUsername())
			.displayName(member.getDisplayName())
			.build();
	}

}

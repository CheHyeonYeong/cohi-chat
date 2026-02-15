package com.coDevs.cohiChat.oauth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.global.security.jwt.JwtTokenProvider;
import com.coDevs.cohiChat.member.MemberRepository;
import com.coDevs.cohiChat.member.RefreshTokenRepository;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Provider;
import com.coDevs.cohiChat.member.entity.RefreshToken;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.member.response.LoginResponseDTO;

@Service
public class OAuthService {

	private final MemberRepository memberRepository;
	private final RefreshTokenRepository refreshTokenRepository;
	private final JwtTokenProvider jwtTokenProvider;
	private final Map<Provider, OAuthClient> oAuthClients;

	public OAuthService(
		MemberRepository memberRepository,
		RefreshTokenRepository refreshTokenRepository,
		JwtTokenProvider jwtTokenProvider,
		List<OAuthClient> oAuthClientList
	) {
		this.memberRepository = memberRepository;
		this.refreshTokenRepository = refreshTokenRepository;
		this.jwtTokenProvider = jwtTokenProvider;
		this.oAuthClients = oAuthClientList.stream()
			.collect(Collectors.toMap(OAuthClient::getProvider, Function.identity()));
	}

	public String getAuthorizationUrl(String providerName) {
		OAuthClient client = getClient(providerName);
		return client.getAuthorizationUrl();
	}

	@Transactional
	public LoginResponseDTO socialLogin(String providerName, String authorizationCode) {
		OAuthClient client = getClient(providerName);
		OAuthUserInfo userInfo = client.getUserInfo(authorizationCode);

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
		String refreshTokenHash = hashToken(refreshTokenValue);
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

	private OAuthClient getClient(String providerName) {
		try {
			Provider provider = Provider.valueOf(providerName.toUpperCase());
			OAuthClient client = oAuthClients.get(provider);
			if (client == null) {
				throw new CustomException(ErrorCode.INVALID_PROVIDER);
			}
			return client;
		} catch (IllegalArgumentException e) {
			throw new CustomException(ErrorCode.INVALID_PROVIDER);
		}
	}

	private String hashToken(String token) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(hash);
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException("SHA-256 algorithm not available", e);
		}
	}
}

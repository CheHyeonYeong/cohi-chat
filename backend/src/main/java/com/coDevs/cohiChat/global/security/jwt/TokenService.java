package com.coDevs.cohiChat.global.security.jwt;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.member.RefreshTokenRepository;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.RefreshToken;
import com.coDevs.cohiChat.member.response.LoginResponseDTO;
import com.coDevs.cohiChat.member.response.RefreshTokenResponseDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TokenService {

	private final JwtTokenProvider jwtTokenProvider;
	private final RefreshTokenRepository refreshTokenRepository;

	@Transactional
	public LoginResponseDTO issueTokens(Member member) {
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

	@Transactional
	public RefreshTokenResponseDTO rotateTokens(Member member) {
		// 기존 RT 삭제
		refreshTokenRepository.deleteById(member.getUsername());

		// 새 RT 발급 및 저장
		String newRefreshTokenValue = jwtTokenProvider.createRefreshToken(member.getUsername());
		long refreshTokenExpirationMs = jwtTokenProvider.getRefreshTokenExpirationMs();
		RefreshToken newRefreshToken = RefreshToken.create(
			hashToken(newRefreshTokenValue), member.getUsername(), refreshTokenExpirationMs
		);
		refreshTokenRepository.save(newRefreshToken);

		// 새 AT 발급
		String newAccessToken = jwtTokenProvider.createAccessToken(
			member.getUsername(), member.getRole().name()
		);
		long expiredInSeconds = jwtTokenProvider.getExpirationSeconds(newAccessToken);

		return RefreshTokenResponseDTO.builder()
			.accessToken(newAccessToken)
			.refreshToken(newRefreshTokenValue)
			.expiredInMinutes(expiredInSeconds / 60)
			.build();
	}

	public String hashToken(String token) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(hash);
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException("SHA-256 algorithm not available", e);
		}
	}
}

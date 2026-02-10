package com.coDevs.cohiChat.member;

import com.coDevs.cohiChat.global.security.jwt.JwtTokenProvider;
import com.coDevs.cohiChat.member.entity.AccessTokenBlacklist;
import com.coDevs.cohiChat.member.entity.RefreshToken;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.member.request.LoginRequestDTO;
import com.coDevs.cohiChat.member.request.SignupRequestDTO;
import com.coDevs.cohiChat.member.request.UpdateMemberRequestDTO;
import com.coDevs.cohiChat.member.response.LoginResponseDTO;
import com.coDevs.cohiChat.member.response.MemberResponseDTO;
import com.coDevs.cohiChat.member.response.RefreshTokenResponseDTO;
import com.coDevs.cohiChat.member.response.SignupResponseDTO;
import com.coDevs.cohiChat.member.response.HostResponseDTO;

import java.util.List;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.global.util.TokenHashUtil;
import com.coDevs.cohiChat.member.entity.Member;

import org.apache.commons.text.RandomStringGenerator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MemberService {

	private final MemberRepository memberRepository;
	private final RefreshTokenRepository refreshTokenRepository;
	private final AccessTokenBlacklistRepository accessTokenBlacklistRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtTokenProvider jwtTokenProvider;

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

		if (!passwordEncoder.matches(request.getPassword(), member.getHashedPassword())) {
			throw new CustomException(ErrorCode.PASSWORD_MISMATCH);
		}

		String accessToken = jwtTokenProvider.createAccessToken(
			member.getUsername(),
			member.getRole().name()
		);

		// 기존 refresh token 삭제 후 새로 발급 (Redis key = username)
		refreshTokenRepository.deleteById(member.getUsername());

		String refreshTokenValue = jwtTokenProvider.createRefreshToken(member.getUsername());
		long refreshTokenExpirationMs = jwtTokenProvider.getRefreshTokenExpirationMs();
		String refreshTokenHash = TokenHashUtil.hash(refreshTokenValue);
		RefreshToken refreshToken = RefreshToken.create(
			refreshTokenHash,
			member.getUsername(),
			refreshTokenExpirationMs
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

	public Member getMember(String username) {

		return memberRepository.findByUsernameAndIsDeletedFalse(username)
			.orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
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
		member.softDelete();
	}

	@Transactional(readOnly = true)
	public List<HostResponseDTO> getActiveHosts() {
		return memberRepository.findByRoleAndIsDeletedFalse(Role.HOST)
			.stream()
			.map(HostResponseDTO::from)
			.toList();
	}

	public void logout(String username, String accessToken) {
		refreshTokenRepository.deleteById(username);

		if (accessToken != null) {
			long remainingSeconds = jwtTokenProvider.getExpirationSeconds(accessToken);
			String tokenHash = TokenHashUtil.hash(accessToken);
			AccessTokenBlacklist blacklist = AccessTokenBlacklist.create(tokenHash, remainingSeconds);
			accessTokenBlacklistRepository.save(blacklist);
		}
	}

	@Transactional(readOnly = true)
	public RefreshTokenResponseDTO refreshAccessToken(String refreshTokenValue) {
		// 1. JWT 토큰 자체 유효성 검증 (만료 vs 위조 구분)
		try {
			jwtTokenProvider.validateTokenOrThrow(refreshTokenValue);
		} catch (ExpiredJwtException e) {
			throw new CustomException(ErrorCode.EXPIRED_REFRESH_TOKEN);
		} catch (JwtException | IllegalArgumentException e) {
			throw new CustomException(ErrorCode.INVALID_REFRESH_TOKEN);
		}

		// 2. Redis에서 해시된 토큰으로 존재 확인 (만료된 토큰은 Redis TTL로 자동 삭제됨)
		String tokenHash = TokenHashUtil.hash(refreshTokenValue);
		RefreshToken refreshToken = refreshTokenRepository.findByToken(tokenHash)
			.orElseThrow(() -> new CustomException(ErrorCode.INVALID_REFRESH_TOKEN));

		// 3. 사용자 정보 조회 및 새 Access Token 발급
		String username = refreshToken.getUsername();
		Member member = memberRepository.findByUsernameAndIsDeletedFalse(username)
			.orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

		String newAccessToken = jwtTokenProvider.createAccessToken(
			member.getUsername(),
			member.getRole().name()
		);

		long expiredInSeconds = jwtTokenProvider.getExpirationSeconds(newAccessToken);

		return RefreshTokenResponseDTO.builder()
			.accessToken(newAccessToken)
			.expiredInMinutes(expiredInSeconds / 60)
			.build();
	}

}

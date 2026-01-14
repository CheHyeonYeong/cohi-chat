package com.coDevs.cohiChat.member;

import com.coDevs.cohiChat.global.security.jwt.JwtTokenProvider;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.member.request.LoginRequestDTO;
import com.coDevs.cohiChat.member.request.SignupRequestDTO;
import com.coDevs.cohiChat.member.request.UpdateMemberRequestDTO;
import com.coDevs.cohiChat.member.response.LoginResponseDTO;
import com.coDevs.cohiChat.member.response.MemberResponseDTO;
import com.coDevs.cohiChat.member.response.SignupResponseDTO;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.entity.Member;

import org.apache.commons.text.RandomStringGenerator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class MemberService {

	private final MemberRepository memberRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtTokenProvider jwtTokenProvider;

	@Value("${jwt.access-token-expiration-minutes}")
	private long accessTokenExpiration;

	@Value("${jwt.refresh-token-expiration-days}")
	private long refreshTokenExpiration;

	@Transactional
	public SignupResponseDTO signup(SignupRequestDTO request){

		if (request.getUsername() == null
			|| request.getUsername().length() < 4
			|| request.getUsername().length() > 12) {
			throw new CustomException(ErrorCode.INVALID_USERNAME);
		}

		if (request.getDisplayName() != null) {
			if (request.getDisplayName().isBlank()
				|| request.getDisplayName().length() < 2
				|| request.getDisplayName().length() > 20) {
				throw new CustomException(ErrorCode.INVALID_DISPLAY_NAME);
			}
		}

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

		if (memberRepository.existsByUsername(username)) {
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

	public LoginResponseDTO login(LoginRequestDTO request){


		Member member = memberRepository.findByUsername(request.getUsername())
			.orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

		if (!passwordEncoder.matches(request.getPassword(), member.getHashedPassword())) {
			throw new CustomException(ErrorCode.PASSWORD_MISMATCH);
		}

		String accessToken = jwtTokenProvider.createAccessToken(
			member.getUsername(),
			member.getRole().name()
		);

		return LoginResponseDTO.builder()
			.accessToken(accessToken)
			.expiredInSeconds(accessTokenExpiration / 1000)
			.username(member.getUsername())
			.displayName(member.getDisplayName())
			.build();
	}

	public Member getMember(String username) {

		return memberRepository.findByUsername(username)
			.orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
	}

	@Transactional
	public MemberResponseDTO updateMember(String username, UpdateMemberRequestDTO request) {

		Member member = getMember(username);

		String hashPw = (request.getPassword() != null && !request.getPassword().isBlank())
			? passwordEncoder.encode(request.getPassword()) : null;

		member.updateInfo(request.getDisplayName(), hashPw);

		return MemberResponseDTO.from(member);
	}

	@Transactional
	public void deleteMember(String username) {

		Member member = getMember(username);

		memberRepository.delete(member);
	}

}

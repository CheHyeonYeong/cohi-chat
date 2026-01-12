package com.coDevs.cohiChat.member;

import com.coDevs.cohiChat.member.request.LoginLocalRequestDTO;
import com.coDevs.cohiChat.member.request.SignupLocalRequestDTO;
import com.coDevs.cohiChat.member.response.LoginResponseDTO;
import com.coDevs.cohiChat.member.response.SignupResponseDTO;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;

import org.apache.commons.text.RandomStringGenerator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.coDevs.cohiChat.global.security.jwt.JwtTokenProvider;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class MemberService {

	private final MemberRepository memberRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtTokenProvider jwtTokenProvider;

	public SignupResponseDTO signupLocal(SignupLocalRequestDTO request){

		if (request.getUsername() == null || request.getUsername().isBlank()) {
			throw new CustomException(ErrorCode.INVALID_USERNAME);
		}

		validateDuplicate(request.getUsername(), request.getEmail());

		String encodedPassword = passwordEncoder.encode(request.getPassword());

		String displayName = request.getDisplayName();
		if (displayName == null || displayName.isBlank()) {
			RandomStringGenerator generator = new RandomStringGenerator.Builder()
				.withinRange('0', 'z')
				.filteredBy(Character::isLetterOrDigit)
				.build();

			displayName = generator.generate(8);
		}

		Member member = Member.create(
			request.getUsername(),
			displayName,
			request.getEmail(),
			encodedPassword,
			request.getRole() != null ? request.getRole() : Role.GUEST
		);

		memberRepository.save(member);

		return SignupResponseDTO.of(member.getId(), member.getUsername(), member.getDisplayName());
	}

	private void validateDuplicate(String username, String email) {
		if (memberRepository.existsByUsername(username)) {
			throw new CustomException(ErrorCode.DUPLICATED_USERNAME);
		}
		if (memberRepository.existsByEmail(email)) {
			throw new CustomException(ErrorCode.DUPLICATED_EMAIL);
		}
	}

	public LoginResponseDTO login(LoginLocalRequestDTO request) {

		Member member = memberRepository.findByUsername(request.getUsername())
			.orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

		if (!passwordEncoder.matches(request.getPassword(), member.getHashedPassword())) {
			throw new CustomException(ErrorCode.PASSWORD_MISMATCH);
		}

		String accessToken = jwtTokenProvider.createAccessToken(
			member.getId(),
			member.getRole().name()
		);

		return LoginResponseDTO.of(accessToken, member.getUsername(), member.getDisplayName());
	}

	public Member getMember(String username) {
		return memberRepository.findByUsername(username)
			.orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
	}

}

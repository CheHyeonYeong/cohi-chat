package com.coDevs.cohiChat.member;

import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.member.request.SignupLocalRequestDTO;
import com.coDevs.cohiChat.member.response.SignupResponseDTO;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.entity.Member;

import org.apache.commons.text.RandomStringGenerator;
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

	@Transactional
	public SignupResponseDTO signupLocal(SignupLocalRequestDTO request){

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

}

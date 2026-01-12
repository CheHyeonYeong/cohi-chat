package com.coDevs.cohiChat.member;

import com.coDevs.cohiChat.member.request.SignupLocalRequestDTO;
import com.coDevs.cohiChat.member.response.SignupResponseDTO;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.member.response.MemberResponseDTO;

import org.apache.commons.text.RandomStringGenerator;

import org.modelmapper.ModelMapper;
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
	private final ModelMapper modelMapper;

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

}


package com.coDevs.cohiChat.member;

import com.coDevs.cohiChat.member.request.SignupLocalRequestDTO;
import com.coDevs.cohiChat.member.response.SignupResponseDTO;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.apache.commons.text.RandomStringGenerator;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class MemberService {

	private final MemberRepository memberRepository;
	private final PasswordEncoder passwordEncoder;

	public SignupResponseDTO signupLocal(SignupLocalRequestDTO request){

		validateDuplicate(request.getUsername(), request.getEmail());

		String encodedPassword = passwordEncoder.encode(request.getPassword());

		Member member = Member.create(
			request.getUsername(),
			request.getDisplayName(),
			request.getEmail(),
			encodedPassword,
			request.getRole()
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
		if (memberRepository.existsByEmail(email)) {
			throw new CustomException(ErrorCode.DUPLICATED_EMAIL);
		}
	}

}

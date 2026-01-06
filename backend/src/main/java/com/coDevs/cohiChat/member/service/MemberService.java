package com.coDevs.cohiChat.member.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.dto.SignupRequestDTO;
import com.coDevs.cohiChat.member.dto.UpdateMemberRequestDTO;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.repository.MemberRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MemberService {

	private final MemberRepository memberRepository;
	private final PasswordEncoder passwordEncoder;

	// 1. 회원가입
	public Member signup(SignupRequestDTO request) {

		if (memberRepository.existsByUsername(request.username())) {
			throw new CustomException(ErrorCode.DUPLICATED_USERNAME);
		}

		if (memberRepository.existsByEmail(request.email())) {
			throw new CustomException(ErrorCode.DUPLICATED_EMAIL);
		}

		String encodedPassword = passwordEncoder.encode(request.password());

		Member member = new Member(
			request.username(),
			request.displayName(),
			request.email(),
			encodedPassword
		);

		return memberRepository.save(member);
	}

	// 2. 사용자 조회
	public Member getByUsername(String username) {
		return memberRepository.findByUsername(username)
			.orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
	}

	// 3. 사용자 정보 수정
	public Member updateUser(String username, UpdateMemberRequestDTO request) {

		Member member = getByUsername(username);

		if (request.displayName() != null) {
			member.updateDisplayName(request.displayName());
		}

		if (request.password() != null) {
			String encoded = passwordEncoder.encode(request.password());
			member.updatePassword(encoded);
		}

		return member;
	}

	// 4. 회원 탈퇴
	public void deleteUser(String username) {
		Member member = getByUsername(username);
		memberRepository.delete(member);
	}

}

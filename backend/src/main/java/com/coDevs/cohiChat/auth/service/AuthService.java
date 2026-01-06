package com.coDevs.cohiChat.auth.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.coDevs.cohiChat.auth.dto.LoginRequest;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.repository.MemberRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

	private final MemberRepository memberRepository;
	private final PasswordEncoder passwordEncoder;

	// 로그인 인증
	public Member authenticate(LoginRequest request) {

		Member member = memberRepository.findByUsername(request.username())
			.orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

		boolean matches = passwordEncoder.matches(
			request.password(),
			member.getHashedPassword()
		);

		if (!matches) {
			throw new CustomException(ErrorCode.PASSWORD_MISMATCH);
		}

		return member;
	}
}

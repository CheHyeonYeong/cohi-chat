/*
package com.coDevs.cohiChat.account.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.coDevs.cohiChat.auth.dto.LoginRequest;
import com.coDevs.cohiChat.member.dto.CreateMemberRequestDTO;
import com.coDevs.cohiChat.member.dto.UpdateMemberRequestDTO;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.repository.MemberRepository;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AccountService {

	private final MemberRepository memberRepository;
	private final PasswordEncoder passwordEncoder;

	// 1. 회원가입
	public Member signup(CreateMemberRequestDTO request) {

		if (memberRepository.existsByUsername(request.username())) {
			throw new CustomException(ErrorCode.DUPLICATED_USERNAME_ERROR);
		}

		if (memberRepository.existsByEmail(request.email())) {
			throw new CustomException(ErrorCode.DUPLICATED_EMAIL_ERROR);
		}

		String encodedPassword =
			passwordEncoder.encode(request.password());

		Member member = Member.create(
			request.username(),
			request.displayName(),
			request.email(),
			encodedPassword
		);

		return memberRepository.save(member);
	}

	// 2. 로그인 인증
	public Member authenticate(LoginRequest request) {

		// 1. username으로 사용자 조회
		Member member = memberRepository.findByUsername(request.username())
			.orElseThrow(() -> new IllegalStateException("username"));

		// 2. 비밀번호 검증
		boolean matches = passwordEncoder.matches(
			request.password(),
			member.getHashedPassword()
		);

		if (!matches) {
			throw new IllegalStateException("password");
		}

		// 3. 인증 성공 → Member 반환
		return member;
	}

	// 3. 사용자명으로 조회
	public Member getMemberByUsername(String username) {
		return memberRepository.findByUsername(username)
			.orElseThrow(() -> new IllegalStateException("username"));
	}

	// 4. 사용자 정보 수정
	public Member updateMember(String username, UpdateMemberRequestDTO request) {

		Member member = memberRepository.findByUsername(username)
			.orElseThrow(() -> new IllegalStateException("username"));

		// 표시명 변경
		if (request.displayName() != null) {
			member.updateDisplayName(request.displayName());
		}

		// 비밀번호 변경
		if (request.password() != null) {
			String encoded = passwordEncoder.encode(request.password());
			member.updatePassword(encoded);
		}

		return member;
	}

	// 5. 회원 탈퇴
	public void deleteMember(String username) {

		Member member = memberRepository.findByUsername(username)
			.orElseThrow(() -> new IllegalStateException("username"));

		memberRepository.delete(member);
	}

	// 6. Username 중복 체크
*/
/*	public boolean existsByUsername(String username) {
		throw new UnsupportedOperationException("구현 예정");
	}

	// 7. Email 중복 체크
	public boolean existsByEmail(String email) {
		throw new UnsupportedOperationException("구현 예정");
	}

	// 8. 비밀번호 검증
	public boolean verifyPassword(String rawPassword, String hashedPassword) {
		throw new UnsupportedOperationException("구현 예정");
	}*//*


}
*/

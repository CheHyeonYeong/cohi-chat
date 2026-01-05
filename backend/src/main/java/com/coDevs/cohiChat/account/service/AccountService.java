package com.coDevs.cohiChat.account.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.coDevs.cohiChat.account.dto.LoginRequest;
import com.coDevs.cohiChat.account.dto.LoginResponse;
import com.coDevs.cohiChat.account.dto.SignupRequest;
import com.coDevs.cohiChat.account.dto.UpdateMemberRequest;
import com.coDevs.cohiChat.account.entity.Member;
import com.coDevs.cohiChat.account.repository.MemberRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AccountService {

	private final MemberRepository userRepository;
	private final PasswordEncoder passwordEncoder;

	// 1. 회원가입
	public Member signup(SignupRequest request) {
		throw new UnsupportedOperationException("구현 예정");
	}

	// 2. 로그인 인증
	public Member authenticate(LoginRequest request) {
		throw new UnsupportedOperationException("구현 예정");
	}

	// 3. 사용자명으로 조회
	public Member getMemberByUsername(String username) {
		throw new UnsupportedOperationException("구현 예정");
	}

	// 4. 사용자 정보 수정
	public Member updateMember(String username, UpdateMemberRequest request) {
		throw new UnsupportedOperationException("구현 예정");
	}

	// 5. 회원 탈퇴
	public void deleteMember(String username) {
		throw new UnsupportedOperationException("구현 예정");
	}

	// 6. Username 중복 체크
	public boolean existsByUsername(String username) {
		throw new UnsupportedOperationException("구현 예정");
	}

	// 7. Email 중복 체크
	public boolean existsByEmail(String email) {
		throw new UnsupportedOperationException("구현 예정");
	}

	// 8. 비밀번호 검증
	public boolean verifyPassword(String rawPassword, String hashedPassword) {
		throw new UnsupportedOperationException("구현 예정");
	}

}

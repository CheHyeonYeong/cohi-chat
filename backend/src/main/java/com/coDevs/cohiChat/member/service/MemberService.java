package com.coDevs.cohiChat.member.service;

import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.dto.CreateMemberRequestDTO;
import com.coDevs.cohiChat.member.dto.CreateMemberResponseDTO;
import com.coDevs.cohiChat.member.dto.MemberResponseDTO;
import com.coDevs.cohiChat.member.dto.UpdateMemberRequestDTO;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.mapper.MemberMapper;
import com.coDevs.cohiChat.member.repository.MemberRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MemberService {

	private final MemberRepository memberRepository;
	private final PasswordEncoder passwordEncoder;
	private final MemberMapper memberMapper;

	// 1. 회원가입
	@Transactional
	public CreateMemberResponseDTO signUp(CreateMemberRequestDTO request) {

		if (!request.password().equals(request.passwordAgain())) {
			throw new CustomException(ErrorCode.PASSWORD_MISMATCH_ERROR);
		}

		if (memberRepository.existsByUsername(request.username())) {
			throw new CustomException(ErrorCode.DUPLICATED_USERNAME_ERROR);
		}

		if (memberRepository.existsByEmail(request.email())) {
			throw new CustomException(ErrorCode.DUPLICATED_EMAIL_ERROR);
		}

		String encodedPassword = passwordEncoder.encode(request.password());

		String displayName = request.displayName();
		if (displayName == null) {
			displayName = generateRandomDisplayName();
		}
		Member member = Member.create(
			request.username(),
			displayName,
			request.email(),
			encodedPassword,
			request.isHost()
		);

		Member savedMember = memberRepository.save(member);

		return memberMapper.toSignupResponse(savedMember);
	}

	private String generateRandomDisplayName() {
		return UUID.randomUUID()
			.toString()
			.replace("-", "")
			.substring(0, 8);
	}

	// 2. 사용자 조회
	public MemberResponseDTO getByUsername(String username) {

		Member member = memberRepository.findByUsername(username)
			.orElseThrow(() ->
				new CustomException(ErrorCode.USER_NOT_FOUND_ERROR)
			);

		return memberMapper.toResponse(member);
	}

	// 3. 사용자 정보 수정
	public MemberResponseDTO updateMember(String username, UpdateMemberRequestDTO request) {

		Member member = memberRepository.findByUsername(username)
			.orElseThrow(() ->
				new CustomException(ErrorCode.USER_NOT_FOUND_ERROR)
			);

		if (request.displayName() != null) {
			member.updateDisplayName(request.displayName());
		}

		if (request.password() != null) {
			String encodedPassword = passwordEncoder.encode(request.password());
			member.updatePassword(encodedPassword);
		}

		// dirty checking 후 DTO 반환
		return memberMapper.toResponse(member);
	}

	// 4. 회원 탈퇴
	public void deleteMe(String username) {
		Member member = getMemberEntityByUsername(username);
		memberRepository.delete(member);
	}

	private Member getMemberEntityByUsername(String username) {
		return memberRepository.findByUsername(username)
			.orElseThrow(() ->
				new CustomException(ErrorCode.USER_NOT_FOUND_ERROR)
			);
	}
}

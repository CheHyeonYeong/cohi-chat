package com.coDevs.cohiChat.member;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.global.util.NicknameGenerator;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.mapper.MemberMapper;
import com.coDevs.cohiChat.member.request.CreateMemberRequestDTO;
import com.coDevs.cohiChat.member.request.UpdateMemberRequestDTO;
import com.coDevs.cohiChat.member.response.CreateMemberResponseDTO;
import com.coDevs.cohiChat.member.response.MemberResponseDTO;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MemberService {

	private final MemberRepository memberRepository;
	private final MemberMapper memberMapper;
	private final PasswordEncoder passwordEncoder;
	private final NicknameGenerator nicknameGenerator;

	@Transactional
	public CreateMemberResponseDTO signUp(CreateMemberRequestDTO request) {

		if (memberRepository.existsByUsername(request.username())) {
			throw new CustomException(ErrorCode.DUPLICATED_USERNAME);
		}

		if (memberRepository.existsByEmail(request.email())) {
			throw new CustomException(ErrorCode.DUPLICATED_EMAIL);
		}

		String encodedPassword = passwordEncoder.encode(request.password());

		String displayName = request.displayName();
		if (displayName == null || displayName.isBlank()) {
			displayName = nicknameGenerator.generate();
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

	public MemberResponseDTO getByUsername(String username) {

		Member member = memberRepository.findByUsername(username)
			.orElseThrow(() ->
				new CustomException(ErrorCode.USER_NOT_FOUND)
			);

		return memberMapper.toResponse(member);
	}


	@Transactional
	public MemberResponseDTO updateMember(String username, UpdateMemberRequestDTO request) {

		Member member = memberRepository.findByUsername(username)
			.orElseThrow(() ->
				new CustomException(ErrorCode.USER_NOT_FOUND)
			);

		if (request.displayName() != null) {
			member.updateDisplayName(request.displayName());
		}

		if (request.password() != null) {
			String encodedPassword = passwordEncoder.encode(request.password());
			member.updatePassword(encodedPassword);
		}

		return memberMapper.toResponse(member);
	}

	@Transactional
	public void deleteMe(String username) {
		Member member = getMemberEntityByUsername(username);
		memberRepository.delete(member);
	}

	private Member getMemberEntityByUsername(String username) {
		return memberRepository.findByUsername(username)
			.orElseThrow(() ->
				new CustomException(ErrorCode.USER_NOT_FOUND)
			);
	}
}

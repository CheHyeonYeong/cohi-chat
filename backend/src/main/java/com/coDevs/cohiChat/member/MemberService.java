package com.coDevs.cohiChat.member;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.request.UpdateMemberRequestDTO;
import com.coDevs.cohiChat.member.response.MemberResponseDTO;

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

	public Member getMember(String username) {

		return memberRepository.findByUsername(username)
			.orElseThrow(() ->
				new CustomException(ErrorCode.USER_NOT_FOUND)
			);
	}

	@Transactional
	public MemberResponseDTO updateMember(String username, UpdateMemberRequestDTO dto){

		Member member = getMember(username);

		String encryptedPassword = null;
		if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
			encryptedPassword = passwordEncoder.encode(dto.getPassword());
		}

		member.updateInfo(dto.getDisplayName(), encryptedPassword);

		return modelMapper.map(member, MemberResponseDTO.class);

	}

	public void deleteMember(String username) {
		Member member = getMember(username);
		memberRepository.delete(member);
	}

}

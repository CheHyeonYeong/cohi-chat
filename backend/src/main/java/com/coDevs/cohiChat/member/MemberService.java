package com.coDevs.cohiChat.member;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.mapper.MemberMapper;
import com.coDevs.cohiChat.member.request.UpdateMemberRequestDTO;

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
	private final MemberMapper memberMapper;

	public Member saveMember(Member member){

		return  memberRepository.save(member);

	}

	public Member getMember(String username) {

		return memberRepository.findByUsername(username)
			.orElseThrow(() ->
				new CustomException(ErrorCode.USER_NOT_FOUND)
			);
	}

	@Transactional
	public Member updateMember(String username, UpdateMemberRequestDTO dto){

		Member member = getMember(username);

		if (dto.displayName() != null && !dto.displayName().isBlank()) {
			member.updateDisplayName(dto.displayName());
		}

		if (dto.password() != null && !dto.password().isBlank()){
			String hashedPassword = passwordEncoder.encode(dto.password());
			member.updatePassword(hashedPassword);
			log.info("비밀번호 수정 완료: {}", dto.password());
		}

		return member;

	}

	public void deleteMember(String username) {
		Member member = getMember(username);
		memberRepository.delete(member);
	}

}

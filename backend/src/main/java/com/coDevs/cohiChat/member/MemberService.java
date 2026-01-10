package com.coDevs.cohiChat.member;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.request.UpdateMemberRequestDTO;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MemberService {

	private final MemberRepository memberRepository;
	private final PasswordEncoder passwordEncoder;

	//저장
	public Member saveMember(Member member){
		return  memberRepository.save(member);
	}

	//조회
	public Member getMember(String username) {
		return memberRepository.findByUsername(username)
			.orElseThrow(() ->
				new CustomException(ErrorCode.USER_NOT_FOUND)
			);
	}

	//수정
	public Member updateMember(String username, UpdateMemberRequestDTO dto){
		Member member = getMember(username);

		if (dto.displayName() != null){
			member.updateDisplayName(dto.displayName());
		}

		if (dto.password() != null){
			String hashedPassword = passwordEncoder.encode(dto.password());
			member.updatePassword(hashedPassword);
		}

		return member;

	}

	//삭제
	public void deleteMember(String username) {
		Member member = getMember(username);
		memberRepository.delete(member);
	}

}

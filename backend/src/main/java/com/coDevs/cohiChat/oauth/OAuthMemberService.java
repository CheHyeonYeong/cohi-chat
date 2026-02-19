package com.coDevs.cohiChat.oauth;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.member.MemberRepository;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OAuthMemberService {

	private final MemberRepository memberRepository;

	@Transactional
	public Member findOrCreate(OAuthUserInfo userInfo) {
		return memberRepository.findByEmailAndProviderAndIsDeletedFalse(
			userInfo.getEmail(), userInfo.getProvider()
		).orElseGet(() -> registerNewMember(userInfo));
	}

	private Member registerNewMember(OAuthUserInfo userInfo) {
		String username = userInfo.getProvider().name().toLowerCase() + "_" + userInfo.getProviderId();
		String displayName = (userInfo.getDisplayName() != null && !userInfo.getDisplayName().isBlank())
			? userInfo.getDisplayName() : username;

		Member member = Member.createOAuth(
			username,
			displayName,
			userInfo.getEmail(),
			userInfo.getProvider(),
			Role.GUEST
		);

		return memberRepository.save(member);
	}
}

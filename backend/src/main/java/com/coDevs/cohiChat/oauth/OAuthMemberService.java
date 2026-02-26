package com.coDevs.cohiChat.oauth;

import java.util.UUID;

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
		return memberRepository.findByProviderAndProviderIdAndIsDeletedFalse(
			userInfo.getProvider(), userInfo.getProviderId()
		).orElseGet(() -> registerNewMember(userInfo));
	}

	private Member registerNewMember(OAuthUserInfo userInfo) {
		String username = userInfo.getProvider().name().toLowerCase() + "_" + userInfo.getProviderId();
		if (memberRepository.existsByUsernameAndIsDeletedFalse(username)) {
			String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 6);
			username = username + "_" + suffix;
		}
		String displayName = (userInfo.getDisplayName() != null && !userInfo.getDisplayName().isBlank())
			? userInfo.getDisplayName() : username;

		Member member = Member.createOAuth(
			username,
			displayName,
			userInfo.getEmail(),
			userInfo.getProviderId(),
			userInfo.getProvider(),
			Role.GUEST
		);

		return memberRepository.save(member);
	}
}

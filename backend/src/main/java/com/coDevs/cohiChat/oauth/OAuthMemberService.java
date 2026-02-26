package com.coDevs.cohiChat.oauth;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
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
		// P3: OAuthUserInfo 필수 필드 방어적 검증
		if (userInfo.getProvider() == null) {
			throw new CustomException(ErrorCode.INVALID_PROVIDER);
		}
		if (userInfo.getProviderId() == null || userInfo.getProviderId().isBlank()) {
			throw new CustomException(ErrorCode.INVALID_PROVIDER);
		}

		return memberRepository.findByProviderAndProviderIdAndIsDeletedFalse(
			userInfo.getProvider(), userInfo.getProviderId()
		).orElseGet(() -> reactivateOrCreate(userInfo));
	}

	/**
	 * P2: 소프트 삭제된 회원이 동일 OAuth 계정으로 재가입 시 UniqueConstraint 위반 방지.
	 * 삭제된 회원이 있으면 복구(restore)하고, 없으면 신규 생성.
	 */
	private Member reactivateOrCreate(OAuthUserInfo userInfo) {
		return memberRepository.findByProviderAndProviderId(
			userInfo.getProvider(), userInfo.getProviderId()
		).map(deleted -> {
			deleted.restore();
			return deleted;
		}).orElseGet(() -> registerNewMember(userInfo));
	}

	private Member registerNewMember(OAuthUserInfo userInfo) {
		String username = userInfo.getProvider().name().toLowerCase() + "_" + userInfo.getProviderId();
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

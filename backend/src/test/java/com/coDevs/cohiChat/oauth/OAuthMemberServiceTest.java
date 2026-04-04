package com.coDevs.cohiChat.oauth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

import java.util.Optional;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.MemberRepository;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Provider;
import com.coDevs.cohiChat.member.entity.Role;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class OAuthMemberServiceTest {

	private static final String TEST_PROVIDER_ID = "test-provider-id";
	private static final String TEST_EMAIL = "test@google.com";
	private static final String TEST_DISPLAY_NAME = "Test User";

	@Mock
	private MemberRepository memberRepository;

	@InjectMocks
	private OAuthMemberService oAuthMemberService;

	@Test
	@DisplayName("성공: 기존 OAuth 회원 조회")
	void findOrCreate_ExistingMember_ReturnsMember() {
		// given
		Member existingMember = Member.createOAuth(
			"google_" + TEST_PROVIDER_ID,
			TEST_DISPLAY_NAME,
			TEST_EMAIL,
			TEST_PROVIDER_ID,
			Provider.GOOGLE,
			Role.GUEST
		);
		OAuthUserInfo userInfo = new OAuthUserInfo(
			Provider.GOOGLE,
			TEST_PROVIDER_ID,
			TEST_EMAIL,
			TEST_DISPLAY_NAME
		);

		given(memberRepository.findByProviderAndProviderIdAndIsDeletedFalse(Provider.GOOGLE, TEST_PROVIDER_ID))
			.willReturn(Optional.of(existingMember));

		// when
		Member result = oAuthMemberService.findOrCreate(userInfo);

		// then
		assertThat(result).isEqualTo(existingMember);
	}

	@Test
	@DisplayName("실패: Ban된 OAuth 회원 로그인 시 MEMBER_BANNED 오류 반환")
	void findOrCreate_BannedMember_ThrowsException() {
		// given
		Member bannedMember = Member.createOAuth(
			"google_" + TEST_PROVIDER_ID,
			TEST_DISPLAY_NAME,
			TEST_EMAIL,
			TEST_PROVIDER_ID,
			Provider.GOOGLE,
			Role.GUEST
		);
		bannedMember.ban();

		OAuthUserInfo userInfo = new OAuthUserInfo(
			Provider.GOOGLE,
			TEST_PROVIDER_ID,
			TEST_EMAIL,
			TEST_DISPLAY_NAME
		);

		given(memberRepository.findByProviderAndProviderIdAndIsDeletedFalse(Provider.GOOGLE, TEST_PROVIDER_ID))
			.willReturn(Optional.of(bannedMember));

		// when & then
		assertThatThrownBy(() -> oAuthMemberService.findOrCreate(userInfo))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.MEMBER_BANNED);
	}

	@Test
	@DisplayName("실패: Provider가 null이면 INVALID_PROVIDER 오류 반환")
	void findOrCreate_NullProvider_ThrowsException() {
		// given
		OAuthUserInfo userInfo = new OAuthUserInfo(
			null,
			TEST_PROVIDER_ID,
			TEST_EMAIL,
			TEST_DISPLAY_NAME
		);

		// when & then
		assertThatThrownBy(() -> oAuthMemberService.findOrCreate(userInfo))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PROVIDER);
	}

	@Test
	@DisplayName("실패: ProviderId가 null이면 INVALID_PROVIDER 오류 반환")
	void findOrCreate_NullProviderId_ThrowsException() {
		// given
		OAuthUserInfo userInfo = new OAuthUserInfo(
			Provider.GOOGLE,
			null,
			TEST_EMAIL,
			TEST_DISPLAY_NAME
		);

		// when & then
		assertThatThrownBy(() -> oAuthMemberService.findOrCreate(userInfo))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PROVIDER);
	}
}

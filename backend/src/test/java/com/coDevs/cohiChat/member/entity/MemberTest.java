package com.coDevs.cohiChat.member.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;

class MemberTest {

	private Member createGuestMember() {
		return Member.create("testuser", "TestUser", "test@test.com", "hashedPw123", Role.GUEST);
	}

	private Member createHostMember() {
		return Member.create("hostuser", "HostUser", "host@test.com", "hashedPw123", Role.HOST);
	}

	@Nested
	@DisplayName("OAuth 회원 생성")
	class CreateOAuth {

		@Test
		@DisplayName("OAuth 회원이 정상 생성된다 (비밀번호 없음)")
		void createOAuthMemberSuccess() {
			Member member = Member.createOAuth("google_123", "GoogleUser", "google@test.com", "123", Provider.GOOGLE, Role.GUEST);

			assertEquals("google_123", member.getUsername());
			assertEquals("GoogleUser", member.getDisplayName());
			assertEquals("google@test.com", member.getEmail());
			assertEquals("123", member.getProviderId());
			assertEquals(Provider.GOOGLE, member.getProvider());
			assertEquals(Role.GUEST, member.getRole());
			assertNull(member.getHashedPassword());
		}

		@Test
		@DisplayName("OAuth 회원은 이메일 없이 생성될 수 있다 (카카오 등 이메일 권한 미제공)")
		void createOAuthMemberWithNullEmailSuccess() {
			Member member = Member.createOAuth("kakao_456", "KakaoUser", null, "456", Provider.KAKAO, Role.GUEST);
			assertNull(member.getEmail());
			assertEquals("kakao_456", member.getUsername());
		}

		@Test
		@DisplayName("OAuth 회원 생성 시 provider가 null이면 예외")
		void createOAuthMemberFailNullProvider() {
			CustomException ex = assertThrows(CustomException.class,
				() -> Member.createOAuth("oauth_user", "User", "user@test.com", "someId", null, Role.GUEST));
			assertEquals(ErrorCode.INVALID_PROVIDER, ex.getErrorCode());
		}

		@Test
		@DisplayName("기존 create()로 생성한 회원은 provider가 LOCAL")
		void createLocalMemberHasLocalProvider() {
			Member member = createGuestMember();
			assertEquals(Provider.LOCAL, member.getProvider());
		}
	}

	@Nested
	@DisplayName("호스트 승격")
	class PromoteToHost {

		@Test
		@DisplayName("GUEST가 HOST로 승격된다")
		void promoteGuestToHost() {
			Member member = createGuestMember();

			member.promoteToHost();

			assertEquals(Role.HOST, member.getRole());
			assertNotNull(member.getHostRegisteredAt());
		}

		@Test
		@DisplayName("이미 HOST인 경우 예외가 발생한다")
		void alreadyHostThrowsException() {
			Member member = createHostMember();

			CustomException ex = assertThrows(CustomException.class, member::promoteToHost);
			assertEquals(ErrorCode.ALREADY_HOST, ex.getErrorCode());
		}

		@Test
		@DisplayName("ADMIN은 HOST로 승격할 수 없다")
		void adminCannotPromoteToHost() {
			Member admin = Member.create("admin", "Admin", "admin@test.com", "hashedPw123", Role.ADMIN);

			CustomException ex = assertThrows(CustomException.class, admin::promoteToHost);
			assertEquals(ErrorCode.ACCESS_DENIED, ex.getErrorCode());
		}
	}

	@Nested
	@DisplayName("프로필 업데이트")
	class UpdateProfile {

		@Test
		@DisplayName("프로필 정보를 업데이트한다")
		void updateProfileSuccess() {
			Member member = createHostMember();
			member.updateProfile("Developer", "https://image.com/1.png");

			assertEquals("Developer", member.getJob());
			assertEquals("https://image.com/1.png", member.getProfileImageUrl());
		}

		@Test
		@DisplayName("빈 문자열을 전달하면 프로필 정보가 null로 초기화된다")
		void updateProfileClearWithEmptyString() {
			Member member = createHostMember();
			member.updateProfile("Developer", "https://image.com/1.png");

			member.updateProfile("", "");

			assertNull(member.getJob());
			assertNull(member.getProfileImageUrl());
		}

		@Test
		@DisplayName("null을 전달하면 기존 프로필 정보가 유지된다")
		void updateProfileKeepWithNull() {
			Member member = createHostMember();
			member.updateProfile("Developer", "https://image.com/1.png");

			member.updateProfile(null, null);

			assertEquals("Developer", member.getJob());
			assertEquals("https://image.com/1.png", member.getProfileImageUrl());
		}
	}
}

package com.coDevs.cohiChat.member.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
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
}

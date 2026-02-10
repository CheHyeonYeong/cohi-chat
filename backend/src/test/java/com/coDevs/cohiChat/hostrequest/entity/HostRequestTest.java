package com.coDevs.cohiChat.hostrequest.entity;

import static org.junit.jupiter.api.Assertions.*;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class HostRequestTest {

	private Member createGuestMember() {
		return Member.create("testuser", "TestUser", "test@test.com", "hashedPw123", Role.GUEST);
	}

	private Member createHostMember() {
		return Member.create("hostuser", "HostUser", "host@test.com", "hashedPw123", Role.HOST);
	}

	private Member createAdminMember() {
		return Member.create("adminuser", "AdminUser", "admin@test.com", "hashedPw123", Role.ADMIN);
	}

	@Nested
	@DisplayName("호스트 승격 신청 생성")
	class Create {

		@Test
		@DisplayName("GUEST가 호스트 승격을 신청할 수 있다")
		void createRequestSuccess() {
			Member guest = createGuestMember();

			HostRequest request = HostRequest.create(guest);

			assertNotNull(request);
			assertEquals(guest, request.getMember());
			assertEquals(HostRequestStatus.PENDING, request.getStatus());
		}

		@Test
		@DisplayName("이미 HOST인 사용자는 신청할 수 없다")
		void alreadyHostCannotRequest() {
			Member host = createHostMember();

			CustomException ex = assertThrows(CustomException.class,
				() -> HostRequest.create(host));
			assertEquals(ErrorCode.ALREADY_HOST, ex.getErrorCode());
		}

		@Test
		@DisplayName("ADMIN 사용자는 신청할 수 없다")
		void adminCannotRequest() {
			Member admin = createAdminMember();

			CustomException ex = assertThrows(CustomException.class,
				() -> HostRequest.create(admin));
			assertEquals(ErrorCode.ALREADY_HOST, ex.getErrorCode());
		}
	}

	@Nested
	@DisplayName("호스트 승격 신청 승인")
	class Approve {

		@Test
		@DisplayName("PENDING 상태의 신청을 승인할 수 있다")
		void approveSuccess() {
			Member guest = createGuestMember();
			HostRequest request = HostRequest.create(guest);

			request.approve();

			assertEquals(HostRequestStatus.APPROVED, request.getStatus());
			assertNotNull(request.getProcessedAt());
		}

		@Test
		@DisplayName("이미 처리된 신청은 승인할 수 없다")
		void alreadyProcessedCannotApprove() {
			Member guest = createGuestMember();
			HostRequest request = HostRequest.create(guest);
			request.approve();

			CustomException ex = assertThrows(CustomException.class, request::approve);
			assertEquals(ErrorCode.HOST_REQUEST_ALREADY_PROCESSED, ex.getErrorCode());
		}
	}

	@Nested
	@DisplayName("호스트 승격 신청 거절")
	class Reject {

		@Test
		@DisplayName("PENDING 상태의 신청을 거절할 수 있다")
		void rejectSuccess() {
			Member guest = createGuestMember();
			HostRequest request = HostRequest.create(guest);

			request.reject();

			assertEquals(HostRequestStatus.REJECTED, request.getStatus());
			assertNotNull(request.getProcessedAt());
		}

		@Test
		@DisplayName("이미 처리된 신청은 거절할 수 없다")
		void alreadyProcessedCannotReject() {
			Member guest = createGuestMember();
			HostRequest request = HostRequest.create(guest);
			request.reject();

			CustomException ex = assertThrows(CustomException.class, request::reject);
			assertEquals(ErrorCode.HOST_REQUEST_ALREADY_PROCESSED, ex.getErrorCode());
		}
	}
}

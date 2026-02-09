package com.coDevs.cohiChat.host;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.coDevs.cohiChat.calendar.CalendarRepository;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.host.response.HostProfileResponseDTO;
import com.coDevs.cohiChat.member.MemberRepository;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;

@ExtendWith(MockitoExtension.class)
class HostServiceTest {

	@InjectMocks
	private HostService hostService;

	@Mock
	private MemberRepository memberRepository;

	@Mock
	private CalendarRepository calendarRepository;

	private static final String TEST_USERNAME = "testuser";

	private Member createGuestMember() {
		return Member.create(TEST_USERNAME, "TestUser", "test@test.com", "hashedPw123", Role.GUEST);
	}

	private Member createHostMember() {
		return Member.create(TEST_USERNAME, "TestUser", "test@test.com", "hashedPw123", Role.HOST);
	}

	@Nested
	@DisplayName("호스트 등록")
	class RegisterAsHost {

		@Test
		@DisplayName("GUEST가 HOST로 승격된다")
		void registerGuestAsHost() {
			Member guest = createGuestMember();
			when(memberRepository.findByUsernameAndIsDeletedFalse(TEST_USERNAME))
				.thenReturn(Optional.of(guest));

			HostProfileResponseDTO result = hostService.registerAsHost(TEST_USERNAME);

			assertEquals(Role.HOST, guest.getRole());
			assertNotNull(guest.getHostRegisteredAt());
			assertEquals(TEST_USERNAME, result.getUsername());
		}

		@Test
		@DisplayName("이미 HOST인 사용자는 예외 발생")
		void alreadyHostThrowsException() {
			Member host = createHostMember();
			when(memberRepository.findByUsernameAndIsDeletedFalse(TEST_USERNAME))
				.thenReturn(Optional.of(host));

			CustomException ex = assertThrows(CustomException.class,
				() -> hostService.registerAsHost(TEST_USERNAME));
			assertEquals(ErrorCode.ALREADY_HOST, ex.getErrorCode());
		}

		@Test
		@DisplayName("존재하지 않는 사용자는 예외 발생")
		void userNotFoundThrowsException() {
			when(memberRepository.findByUsernameAndIsDeletedFalse(TEST_USERNAME))
				.thenReturn(Optional.empty());

			CustomException ex = assertThrows(CustomException.class,
				() -> hostService.registerAsHost(TEST_USERNAME));
			assertEquals(ErrorCode.USER_NOT_FOUND, ex.getErrorCode());
		}
	}

	@Nested
	@DisplayName("호스트 프로필 조회")
	class GetHostProfile {

		@Test
		@DisplayName("HOST의 프로필을 조회한다")
		void getHostProfileSuccess() {
			Member host = createHostMember();
			when(memberRepository.findByUsernameAndIsDeletedFalse(TEST_USERNAME))
				.thenReturn(Optional.of(host));
			when(calendarRepository.existsByUserId(host.getId()))
				.thenReturn(true);

			HostProfileResponseDTO result = hostService.getHostProfile(TEST_USERNAME);

			assertEquals(TEST_USERNAME, result.getUsername());
			assertEquals("TestUser", result.getDisplayName());
			assertTrue(result.isCalendarConnected());
		}

		@Test
		@DisplayName("GUEST가 호스트 프로필 조회 시 예외 발생")
		void guestAccessDenied() {
			Member guest = createGuestMember();
			when(memberRepository.findByUsernameAndIsDeletedFalse(TEST_USERNAME))
				.thenReturn(Optional.of(guest));

			CustomException ex = assertThrows(CustomException.class,
				() -> hostService.getHostProfile(TEST_USERNAME));
			assertEquals(ErrorCode.GUEST_ACCESS_DENIED, ex.getErrorCode());
		}
	}

	@Nested
	@DisplayName("호스트 프로필 수정")
	class UpdateHostProfile {

		@Test
		@DisplayName("HOST의 displayName을 수정한다")
		void updateHostProfileSuccess() {
			Member host = createHostMember();
			when(memberRepository.findByUsernameAndIsDeletedFalse(TEST_USERNAME))
				.thenReturn(Optional.of(host));
			when(calendarRepository.existsByUserId(host.getId()))
				.thenReturn(false);

			HostProfileResponseDTO result = hostService.updateHostProfile(TEST_USERNAME, "NewDisplayName");

			assertEquals("NewDisplayName", result.getDisplayName());
		}

		@Test
		@DisplayName("GUEST가 호스트 프로필 수정 시 예외 발생")
		void guestCannotUpdateHostProfile() {
			Member guest = createGuestMember();
			when(memberRepository.findByUsernameAndIsDeletedFalse(TEST_USERNAME))
				.thenReturn(Optional.of(guest));

			CustomException ex = assertThrows(CustomException.class,
				() -> hostService.updateHostProfile(TEST_USERNAME, "NewName"));
			assertEquals(ErrorCode.GUEST_ACCESS_DENIED, ex.getErrorCode());
		}
	}
}

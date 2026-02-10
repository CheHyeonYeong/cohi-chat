package com.coDevs.cohiChat.hostrequest;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.hostrequest.entity.HostRequest;
import com.coDevs.cohiChat.hostrequest.entity.HostRequestStatus;
import com.coDevs.cohiChat.hostrequest.response.HostRequestResponseDTO;
import com.coDevs.cohiChat.member.MemberService;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class HostRequestServiceTest {

	@InjectMocks
	private HostRequestService hostRequestService;

	@Mock
	private HostRequestRepository hostRequestRepository;

	@Mock
	private MemberService memberService;

	private static final String TEST_USERNAME = "testuser";

	private Member createGuestMember() {
		return Member.create(TEST_USERNAME, "TestUser", "test@test.com", "hashedPw123", Role.GUEST);
	}

	private Member createHostMember() {
		return Member.create("hostuser", "HostUser", "host@test.com", "hashedPw123", Role.HOST);
	}

	@Nested
	@DisplayName("호스트 승격 신청")
	class CreateRequest {

		@Test
		@DisplayName("GUEST가 호스트 승격을 신청할 수 있다")
		void createRequestSuccess() {
			Member guest = createGuestMember();
			when(memberService.getMember(TEST_USERNAME)).thenReturn(guest);
			when(hostRequestRepository.existsByMemberIdAndStatus(any(), eq(HostRequestStatus.PENDING)))
				.thenReturn(false);
			when(hostRequestRepository.save(any(HostRequest.class)))
				.thenAnswer(invocation -> invocation.getArgument(0));

			HostRequestResponseDTO result = hostRequestService.createRequest(TEST_USERNAME);

			assertNotNull(result);
			assertEquals(TEST_USERNAME, result.getUsername());
			assertEquals(HostRequestStatus.PENDING, result.getStatus());
			verify(hostRequestRepository).save(any(HostRequest.class));
		}

		@Test
		@DisplayName("이미 HOST인 사용자는 신청할 수 없다")
		void alreadyHostCannotRequest() {
			Member host = createHostMember();
			when(memberService.getMember("hostuser")).thenReturn(host);

			CustomException ex = assertThrows(CustomException.class,
				() -> hostRequestService.createRequest("hostuser"));
			assertEquals(ErrorCode.ALREADY_HOST, ex.getErrorCode());
		}

		@Test
		@DisplayName("이미 PENDING 상태의 신청이 있으면 중복 신청할 수 없다")
		void duplicateRequestFails() {
			Member guest = createGuestMember();
			when(memberService.getMember(TEST_USERNAME)).thenReturn(guest);
			when(hostRequestRepository.existsByMemberIdAndStatus(any(), eq(HostRequestStatus.PENDING)))
				.thenReturn(true);

			CustomException ex = assertThrows(CustomException.class,
				() -> hostRequestService.createRequest(TEST_USERNAME));
			assertEquals(ErrorCode.HOST_REQUEST_ALREADY_EXISTS, ex.getErrorCode());
		}
	}

	@Nested
	@DisplayName("호스트 신청 목록 조회")
	class GetPendingRequests {

		@Test
		@DisplayName("PENDING 상태의 신청 목록을 조회할 수 있다")
		void getPendingRequestsSuccess() {
			Member guest = createGuestMember();
			HostRequest request = HostRequest.create(guest);
			when(hostRequestRepository.findByStatusWithMember(HostRequestStatus.PENDING))
				.thenReturn(List.of(request));

			List<HostRequestResponseDTO> result = hostRequestService.getPendingRequests();

			assertEquals(1, result.size());
			assertEquals(TEST_USERNAME, result.get(0).getUsername());
			assertEquals(HostRequestStatus.PENDING, result.get(0).getStatus());
		}
	}

	@Nested
	@DisplayName("호스트 승격 승인")
	class ApproveRequest {

		@Test
		@DisplayName("PENDING 상태의 신청을 승인하면 회원이 HOST로 승격된다")
		void approveSuccess() {
			Member guest = createGuestMember();
			HostRequest request = HostRequest.create(guest);
			when(hostRequestRepository.findById(1L)).thenReturn(Optional.of(request));

			HostRequestResponseDTO result = hostRequestService.approveRequest(1L);

			assertEquals(HostRequestStatus.APPROVED, result.getStatus());
			assertEquals(Role.HOST, guest.getRole());
			assertNotNull(guest.getHostRegisteredAt());
		}

		@Test
		@DisplayName("존재하지 않는 신청은 승인할 수 없다")
		void notFoundFails() {
			when(hostRequestRepository.findById(999L)).thenReturn(Optional.empty());

			CustomException ex = assertThrows(CustomException.class,
				() -> hostRequestService.approveRequest(999L));
			assertEquals(ErrorCode.HOST_REQUEST_NOT_FOUND, ex.getErrorCode());
		}

		@Test
		@DisplayName("이미 처리된 신청은 승인할 수 없다")
		void alreadyProcessedFails() {
			Member guest = createGuestMember();
			HostRequest request = HostRequest.create(guest);
			request.approve();
			when(hostRequestRepository.findById(1L)).thenReturn(Optional.of(request));

			CustomException ex = assertThrows(CustomException.class,
				() -> hostRequestService.approveRequest(1L));
			assertEquals(ErrorCode.HOST_REQUEST_ALREADY_PROCESSED, ex.getErrorCode());
		}
	}

	@Nested
	@DisplayName("호스트 승격 거절")
	class RejectRequest {

		@Test
		@DisplayName("PENDING 상태의 신청을 거절할 수 있다")
		void rejectSuccess() {
			Member guest = createGuestMember();
			HostRequest request = HostRequest.create(guest);
			when(hostRequestRepository.findById(1L)).thenReturn(Optional.of(request));

			HostRequestResponseDTO result = hostRequestService.rejectRequest(1L);

			assertEquals(HostRequestStatus.REJECTED, result.getStatus());
			assertEquals(Role.GUEST, guest.getRole());
		}

		@Test
		@DisplayName("존재하지 않는 신청은 거절할 수 없다")
		void notFoundFails() {
			when(hostRequestRepository.findById(999L)).thenReturn(Optional.empty());

			CustomException ex = assertThrows(CustomException.class,
				() -> hostRequestService.rejectRequest(999L));
			assertEquals(ErrorCode.HOST_REQUEST_NOT_FOUND, ex.getErrorCode());
		}

		@Test
		@DisplayName("이미 처리된 신청은 거절할 수 없다")
		void alreadyProcessedFails() {
			Member guest = createGuestMember();
			HostRequest request = HostRequest.create(guest);
			request.reject();
			when(hostRequestRepository.findById(1L)).thenReturn(Optional.of(request));

			CustomException ex = assertThrows(CustomException.class,
				() -> hostRequestService.rejectRequest(1L));
			assertEquals(ErrorCode.HOST_REQUEST_ALREADY_PROCESSED, ex.getErrorCode());
		}
	}
}

package com.coDevs.cohiChat.hostrequest;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.List;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.hostrequest.entity.HostRequestStatus;
import com.coDevs.cohiChat.hostrequest.response.HostRequestResponseDTO;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AdminHostRequestController.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminHostRequestControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private HostRequestService hostRequestService;

	private HostRequestResponseDTO createPendingResponse() {
		return HostRequestResponseDTO.builder()
			.id(1L)
			.username("testuser")
			.displayName("TestUser")
			.status(HostRequestStatus.PENDING)
			.build();
	}

	private HostRequestResponseDTO createApprovedResponse() {
		return HostRequestResponseDTO.builder()
			.id(1L)
			.username("testuser")
			.displayName("TestUser")
			.status(HostRequestStatus.APPROVED)
			.build();
	}

	private HostRequestResponseDTO createRejectedResponse() {
		return HostRequestResponseDTO.builder()
			.id(1L)
			.username("testuser")
			.displayName("TestUser")
			.status(HostRequestStatus.REJECTED)
			.build();
	}

	@Nested
	@DisplayName("GET /admin/host-requests")
	class GetHostRequests {

		@Test
		@DisplayName("PENDING 상태의 신청 목록을 조회할 수 있다")
		void getRequestsSuccess() throws Exception {
			when(hostRequestService.getPendingRequests())
				.thenReturn(List.of(createPendingResponse()));

			mockMvc.perform(get("/admin/host-requests"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data[0].username").value("testuser"))
				.andExpect(jsonPath("$.data[0].status").value("PENDING"));
		}
	}

	@Nested
	@DisplayName("PATCH /admin/host-requests/{id}/approve")
	class ApproveHostRequest {

		@Test
		@DisplayName("신청 승인 성공 시 200 반환")
		void approveSuccess() throws Exception {
			when(hostRequestService.approveRequest(1L)).thenReturn(createApprovedResponse());

			mockMvc.perform(patch("/admin/host-requests/{id}/approve", 1L))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.status").value("APPROVED"));
		}

		@Test
		@DisplayName("존재하지 않는 신청 승인 시 404 반환")
		void notFoundReturns404() throws Exception {
			when(hostRequestService.approveRequest(999L))
				.thenThrow(new CustomException(ErrorCode.HOST_REQUEST_NOT_FOUND));

			mockMvc.perform(patch("/admin/host-requests/{id}/approve", 999L))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.success").value(false));
		}

		@Test
		@DisplayName("이미 처리된 신청 승인 시 409 반환")
		void alreadyProcessedReturns409() throws Exception {
			when(hostRequestService.approveRequest(1L))
				.thenThrow(new CustomException(ErrorCode.HOST_REQUEST_ALREADY_PROCESSED));

			mockMvc.perform(patch("/admin/host-requests/{id}/approve", 1L))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.success").value(false));
		}
	}

	@Nested
	@DisplayName("PATCH /admin/host-requests/{id}/reject")
	class RejectHostRequest {

		@Test
		@DisplayName("신청 거절 성공 시 200 반환")
		void rejectSuccess() throws Exception {
			when(hostRequestService.rejectRequest(1L)).thenReturn(createRejectedResponse());

			mockMvc.perform(patch("/admin/host-requests/{id}/reject", 1L))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.status").value("REJECTED"));
		}

		@Test
		@DisplayName("존재하지 않는 신청 거절 시 404 반환")
		void notFoundReturns404() throws Exception {
			when(hostRequestService.rejectRequest(999L))
				.thenThrow(new CustomException(ErrorCode.HOST_REQUEST_NOT_FOUND));

			mockMvc.perform(patch("/admin/host-requests/{id}/reject", 999L))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.success").value(false));
		}
	}
}

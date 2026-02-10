package com.coDevs.cohiChat.hostrequest;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

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

@WebMvcTest(HostRequestController.class)
@AutoConfigureMockMvc(addFilters = false)
class HostRequestControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private HostRequestService hostRequestService;

	private static final String TEST_USERNAME = "testuser";

	private HostRequestResponseDTO createResponse() {
		return HostRequestResponseDTO.builder()
			.id(1L)
			.username(TEST_USERNAME)
			.displayName("TestUser")
			.status(HostRequestStatus.PENDING)
			.build();
	}

	@Nested
	@DisplayName("POST /members/v1/{username}/host-request")
	class CreateHostRequest {

		@Test
		@DisplayName("호스트 승격 신청 성공 시 201 반환")
		void createSuccess() throws Exception {
			when(hostRequestService.createRequest(TEST_USERNAME)).thenReturn(createResponse());

			mockMvc.perform(post("/members/v1/{username}/host-request", TEST_USERNAME)
					.principal(() -> TEST_USERNAME))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.username").value(TEST_USERNAME))
				.andExpect(jsonPath("$.data.status").value("PENDING"));
		}

		@Test
		@DisplayName("이미 HOST인 사용자 신청 시 409 반환")
		void alreadyHostReturns409() throws Exception {
			when(hostRequestService.createRequest(TEST_USERNAME))
				.thenThrow(new CustomException(ErrorCode.ALREADY_HOST));

			mockMvc.perform(post("/members/v1/{username}/host-request", TEST_USERNAME)
					.principal(() -> TEST_USERNAME))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.success").value(false));
		}

		@Test
		@DisplayName("중복 신청 시 409 반환")
		void duplicateRequestReturns409() throws Exception {
			when(hostRequestService.createRequest(TEST_USERNAME))
				.thenThrow(new CustomException(ErrorCode.HOST_REQUEST_ALREADY_EXISTS));

			mockMvc.perform(post("/members/v1/{username}/host-request", TEST_USERNAME)
					.principal(() -> TEST_USERNAME))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.success").value(false));
		}
	}
}

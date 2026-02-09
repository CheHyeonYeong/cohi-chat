package com.coDevs.cohiChat.host;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.coDevs.cohiChat.calendar.CalendarService;
import com.coDevs.cohiChat.calendar.request.CalendarCreateRequestDTO;
import com.coDevs.cohiChat.calendar.response.CalendarResponseDTO;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.host.response.HostProfileResponseDTO;
import com.coDevs.cohiChat.member.MemberService;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(HostController.class)
@AutoConfigureMockMvc(addFilters = false)
class HostControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@MockitoBean
	private HostService hostService;

	@MockitoBean
	private CalendarService calendarService;

	@MockitoBean
	private MemberService memberService;

	private HostProfileResponseDTO createProfileResponse() {
		return HostProfileResponseDTO.builder()
			.username("testuser")
			.displayName("TestUser")
			.email("test@test.com")
			.hostRegisteredAt(Instant.now())
			.calendarConnected(false)
			.build();
	}

	@Nested
	@DisplayName("호스트 등록 API")
	class Register {

		@Test
		@DisplayName("호스트 등록 성공 시 201 반환")
		void registerSuccess() throws Exception {
			when(hostService.registerAsHost(anyString())).thenReturn(createProfileResponse());

			mockMvc.perform(post("/hosts/v1/register")
					.principal(() -> "testuser"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.username").value("testuser"));
		}

		@Test
		@DisplayName("이미 호스트인 경우 409 반환")
		void registerAlreadyHost() throws Exception {
			when(hostService.registerAsHost(anyString()))
				.thenThrow(new CustomException(ErrorCode.ALREADY_HOST));

			mockMvc.perform(post("/hosts/v1/register")
					.principal(() -> "testuser"))
				.andExpect(status().isConflict());
		}
	}

	@Nested
	@DisplayName("호스트 프로필 조회 API")
	class GetProfile {

		@Test
		@DisplayName("프로필 조회 성공 시 200 반환")
		void getProfileSuccess() throws Exception {
			when(hostService.getHostProfile(anyString())).thenReturn(createProfileResponse());

			mockMvc.perform(get("/hosts/v1/me")
					.principal(() -> "testuser"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.username").value("testuser"))
				.andExpect(jsonPath("$.data.calendarConnected").value(false));
		}

		@Test
		@DisplayName("GUEST 접근 시 403 반환")
		void guestAccessDenied() throws Exception {
			when(hostService.getHostProfile(anyString()))
				.thenThrow(new CustomException(ErrorCode.GUEST_ACCESS_DENIED));

			mockMvc.perform(get("/hosts/v1/me")
					.principal(() -> "testuser"))
				.andExpect(status().isForbidden());
		}
	}

	@Nested
	@DisplayName("호스트 프로필 수정 API")
	class UpdateProfile {

		@Test
		@DisplayName("프로필 수정 성공 시 200 반환")
		void updateProfileSuccess() throws Exception {
			HostProfileResponseDTO updated = HostProfileResponseDTO.builder()
				.username("testuser")
				.displayName("NewName")
				.email("test@test.com")
				.hostRegisteredAt(Instant.now())
				.calendarConnected(false)
				.build();

			when(hostService.updateHostProfile(anyString(), anyString())).thenReturn(updated);

			mockMvc.perform(put("/hosts/v1/me")
					.principal(() -> "testuser")
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"displayName\": \"NewName\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.displayName").value("NewName"));
		}
	}

	@Nested
	@DisplayName("Google Calendar 연동 API")
	class ConnectCalendar {

		@Test
		@DisplayName("캘린더 연동 성공 시 201 반환")
		void connectCalendarSuccess() throws Exception {
			CalendarResponseDTO calendarResponse = CalendarResponseDTO.builder()
				.userId(UUID.randomUUID())
				.topics(List.of("면접", "상담"))
				.description("1:1 미팅 캘린더입니다.")
				.googleCalendarId("test@group.calendar.google.com")
				.createdAt(Instant.now())
				.updatedAt(Instant.now())
				.build();

			when(calendarService.createCalendar(any(), any())).thenReturn(calendarResponse);

			CalendarCreateRequestDTO request = CalendarCreateRequestDTO.builder()
				.topics(List.of("면접", "상담"))
				.description("1:1 미팅 캘린더입니다.")
				.googleCalendarId("test@group.calendar.google.com")
				.build();

			mockMvc.perform(post("/hosts/v1/me/calendar/connect")
					.principal(() -> "testuser")
					.contentType(MediaType.APPLICATION_JSON)
					.content(objectMapper.writeValueAsString(request)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.googleCalendarId").value("test@group.calendar.google.com"));
		}

		@Test
		@DisplayName("이미 캘린더가 있는 경우 409 반환")
		void calendarAlreadyExists() throws Exception {
			when(calendarService.createCalendar(any(), any()))
				.thenThrow(new CustomException(ErrorCode.CALENDAR_ALREADY_EXISTS));

			CalendarCreateRequestDTO request = CalendarCreateRequestDTO.builder()
				.topics(List.of("면접"))
				.description("1:1 미팅 캘린더입니다.")
				.googleCalendarId("test@group.calendar.google.com")
				.build();

			mockMvc.perform(post("/hosts/v1/me/calendar/connect")
					.principal(() -> "testuser")
					.contentType(MediaType.APPLICATION_JSON)
					.content(objectMapper.writeValueAsString(request)))
				.andExpect(status().isConflict());
		}
	}
}

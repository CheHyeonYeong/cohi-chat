package com.coDevs.cohiChat.member;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import com.coDevs.cohiChat.config.EmbeddedRedisConfig;
import org.springframework.test.web.servlet.MockMvc;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.member.response.MemberResponseDTO;
import com.coDevs.cohiChat.member.response.RefreshTokenResponseDTO;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(EmbeddedRedisConfig.class)
class MemberControllerIntegrationTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@MockitoBean
	private MemberService memberService;

	private static final String TEST_USERNAME = "testuser";
	private static final String OTHER_USERNAME = "otheruser";

	@Test
	@DisplayName("인증 없이 로그아웃 호출 시 401 또는 403 반환")
	void logoutWithoutAuthReturnsForbidden() throws Exception {
		mockMvc.perform(delete("/members/v1/logout"))
			.andExpect(status().isForbidden());
	}

	@Nested
	@DisplayName("회원 조회 API 인가 테스트")
	class GetMemberAuthorizationTest {

		@Test
		@WithMockUser(username = TEST_USERNAME)
		@DisplayName("자기 자신 조회 시 200 OK 반환")
		void getMemberSelfAccessAllowed() throws Exception {
			Member mockMember = Member.create(TEST_USERNAME, "Display", "test@test.com", "hashed", Role.GUEST);
			when(memberService.getMember(TEST_USERNAME)).thenReturn(mockMember);

			mockMvc.perform(get("/members/v1/{username}", TEST_USERNAME))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.username").value(TEST_USERNAME));
		}

		@Test
		@WithMockUser(username = TEST_USERNAME)
		@DisplayName("다른 사용자 조회 시 403 Forbidden 반환")
		void getMemberCrossUserAccessForbidden() throws Exception {
			mockMvc.perform(get("/members/v1/{username}", OTHER_USERNAME))
				.andExpect(status().isForbidden());
		}

		@Test
		@DisplayName("인증 없이 조회 시 403 Forbidden 반환")
		void getMemberWithoutAuthForbidden() throws Exception {
			mockMvc.perform(get("/members/v1/{username}", TEST_USERNAME))
				.andExpect(status().isForbidden());
		}
	}

	@Nested
	@DisplayName("회원 수정 API 인가 테스트")
	class UpdateMemberAuthorizationTest {

		@Test
		@WithMockUser(username = TEST_USERNAME)
		@DisplayName("자기 자신 수정 시 200 OK 반환")
		void updateMemberSelfAccessAllowed() throws Exception {
			MemberResponseDTO responseDTO = MemberResponseDTO.builder()
				.id(UUID.randomUUID())
				.username(TEST_USERNAME)
				.displayName("NewNick")
				.email("test@test.com")
				.role(Role.GUEST)
				.createdAt(Instant.now())
				.updatedAt(Instant.now())
				.build();

			when(memberService.updateMember(anyString(), any())).thenReturn(responseDTO);

			mockMvc.perform(patch("/members/v1/{username}", TEST_USERNAME)
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"displayName\": \"NewNick\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.username").value(TEST_USERNAME));
		}

		@Test
		@WithMockUser(username = TEST_USERNAME)
		@DisplayName("다른 사용자 수정 시 403 Forbidden 반환")
		void updateMemberCrossUserAccessForbidden() throws Exception {
			mockMvc.perform(patch("/members/v1/{username}", OTHER_USERNAME)
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"displayName\": \"NewNick\"}"))
				.andExpect(status().isForbidden());
		}

		@Test
		@DisplayName("인증 없이 수정 시 403 Forbidden 반환")
		void updateMemberWithoutAuthForbidden() throws Exception {
			mockMvc.perform(patch("/members/v1/{username}", TEST_USERNAME)
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"displayName\": \"NewNick\"}"))
				.andExpect(status().isForbidden());
		}
	}

	@Nested
	@DisplayName("POST /members/v1/refresh - 토큰 갱신 API")
	class RefreshTokenTest {

		private static final String REFRESH_ENDPOINT = "/members/v1/refresh";

		@Test
		@DisplayName("유효한 RT 제출 시 200 OK + 새 AT/RT 반환")
		void refreshWithValidToken_returns200WithNewTokens() throws Exception {
			RefreshTokenResponseDTO response = RefreshTokenResponseDTO.builder()
				.accessToken("new-access-token")
				.refreshToken("new-refresh-token")
				.expiredInMinutes(30)
				.build();
			when(memberService.refreshAccessToken(anyString())).thenReturn(response);

			mockMvc.perform(post(REFRESH_ENDPOINT)
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"refreshToken\": \"valid-refresh-token\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.accessToken").value("new-access-token"))
				.andExpect(jsonPath("$.data.refreshToken").value("new-refresh-token"))
				.andExpect(jsonPath("$.data.expiredInMinutes").value(30));
		}

		@Test
		@DisplayName("유효하지 않은 RT 제출 시 401 Unauthorized 반환")
		void refreshWithInvalidToken_returns401() throws Exception {
			when(memberService.refreshAccessToken(anyString()))
				.thenThrow(new CustomException(ErrorCode.INVALID_REFRESH_TOKEN));

			mockMvc.perform(post(REFRESH_ENDPOINT)
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"refreshToken\": \"invalid-token\"}"))
				.andExpect(status().isUnauthorized());
		}

		@Test
		@DisplayName("만료된 RT 제출 시 401 Unauthorized 반환")
		void refreshWithExpiredToken_returns401() throws Exception {
			when(memberService.refreshAccessToken(anyString()))
				.thenThrow(new CustomException(ErrorCode.EXPIRED_REFRESH_TOKEN));

			mockMvc.perform(post(REFRESH_ENDPOINT)
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"refreshToken\": \"expired-token\"}"))
				.andExpect(status().isUnauthorized());
		}

		@Test
		@DisplayName("Rate Limit 초과 시 429 Too Many Requests 반환")
		void refreshWithRateLimitExceeded_returns429() throws Exception {
			when(memberService.refreshAccessToken(anyString()))
				.thenThrow(new CustomException(ErrorCode.RATE_LIMIT_EXCEEDED));

			mockMvc.perform(post(REFRESH_ENDPOINT)
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"refreshToken\": \"valid-but-rate-limited\"}"))
				.andExpect(status().isTooManyRequests());
		}

		@Test
		@DisplayName("RT 미포함(빈 값) 요청 시 400 Bad Request 반환")
		void refreshWithBlankToken_returns400() throws Exception {
			mockMvc.perform(post(REFRESH_ENDPOINT)
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"refreshToken\": \"\"}"))
				.andExpect(status().isBadRequest());
		}
	}

	@Nested
	@DisplayName("회원 삭제 API 인가 테스트")
	class DeleteMemberAuthorizationTest {

		@Test
		@WithMockUser(username = TEST_USERNAME)
		@DisplayName("자기 자신 삭제 시 204 No Content 반환")
		void deleteMemberSelfAccessAllowed() throws Exception {
			doNothing().when(memberService).deleteMember(TEST_USERNAME);

			mockMvc.perform(delete("/members/v1/{username}", TEST_USERNAME))
				.andExpect(status().isNoContent());
		}

		@Test
		@WithMockUser(username = TEST_USERNAME)
		@DisplayName("다른 사용자 삭제 시 403 Forbidden 반환")
		void deleteMemberCrossUserAccessForbidden() throws Exception {
			mockMvc.perform(delete("/members/v1/{username}", OTHER_USERNAME))
				.andExpect(status().isForbidden());
		}

		@Test
		@DisplayName("인증 없이 삭제 시 403 Forbidden 반환")
		void deleteMemberWithoutAuthForbidden() throws Exception {
			mockMvc.perform(delete("/members/v1/{username}", TEST_USERNAME))
				.andExpect(status().isForbidden());
		}
	}
}

package com.coDevs.cohiChat.member.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willDoNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.ArgumentMatchers.anyString;

import com.coDevs.cohiChat.member.MemberController;
import com.coDevs.cohiChat.member.request.CreateMemberRequestDTO;
import com.coDevs.cohiChat.member.response.CreateMemberResponseDTO;
import com.coDevs.cohiChat.member.response.MemberResponseDTO;
import com.coDevs.cohiChat.member.request.UpdateMemberRequestDTO;
import com.coDevs.cohiChat.member.MemberService;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(
	controllers = MemberController.class,
	excludeAutoConfiguration = SecurityAutoConfiguration.class
)
class MemberControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@MockitoBean
	private MemberService memberService;

	@DisplayName("회원가입 성공 - ApiResponse 구조 일관성 확인")
	@Test
	void signupSuccess() throws Exception {

		CreateMemberRequestDTO request = new CreateMemberRequestDTO(
			"testuser",
			"password123",
			"password123",
			"test@test.com",
			null,
			false
		);

		CreateMemberResponseDTO response =
			new CreateMemberResponseDTO(
				UUID.randomUUID(),
				"testuser",
				"달콤한커피개발자",
				"test@test.com",
				false,
				LocalDateTime.now(),
				LocalDateTime.now()
			);

		given(memberService.signUp(any()))
			.willReturn(response);

		mockMvc.perform(post("/members/signup")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(request)))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.success").value(true))
			.andExpect(jsonPath("$.data").exists())
			.andExpect(jsonPath("$.error").isEmpty());
	}

	@DisplayName("내 정보 조회 성공 - ApiResponse 구조 일관성 확인")
	@Test
	void getMeSuccess() throws Exception {

		given(memberService.getByUsername(anyString()))
			.willReturn(memberResponse());

		mockMvc.perform(get("/members/@me")
				.principal(() -> "testuser")
				.accept(MediaType.APPLICATION_JSON))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.success").value(true))
			.andExpect(jsonPath("$.data").exists())
			.andExpect(jsonPath("$.error").isEmpty());
	}

	@DisplayName("내 정보 수정 성공 - ApiResponse 구조 일관성 확인")
	@WithMockUser(username = "testuser")
	@Test
	void updateMeSuccess() throws Exception {

		UpdateMemberRequestDTO request =
			new UpdateMemberRequestDTO("새닉네임", "newPassword123");

		given(memberService.updateMember(eq("testuser"), any()))
			.willReturn(memberResponse());

		mockMvc.perform(patch("/members/@me")
				.principal(() -> "testuser")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(request)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.success").value(true))
			.andExpect(jsonPath("$.data").exists())
			.andExpect(jsonPath("$.error").isEmpty());
	}

	@DisplayName("회원 탈퇴 성공 - 상태 코드만 확인")
	@WithMockUser(username = "testuser")
	@Test
	void deleteMeSuccess() throws Exception {

		willDoNothing().given(memberService).deleteMe("testuser");

		mockMvc.perform(delete("/members/@me")
				.principal(() -> "testuser"))
				.andExpect(status().isNoContent());
	}

	private MemberResponseDTO memberResponse() {
		return new MemberResponseDTO(
			UUID.randomUUID(),
			"testuser",
			"달콤한커피개발자",
			"test@test.com",
			false,
			LocalDateTime.now(),
			LocalDateTime.now()
		);
	}
}



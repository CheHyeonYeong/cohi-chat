package com.coDevs.cohiChat.member;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import java.util.stream.Stream;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.coDevs.cohiChat.member.request.SignupRequestDTO;
import com.coDevs.cohiChat.member.response.SignupResponseDTO;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(MemberController.class)
@AutoConfigureMockMvc(addFilters = false)
class MemberControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@MockitoBean
	private MemberService memberService;

	private static final String TEST_USERNAME = "testtest";
	private static final String TEST_EMAIL = "test@test.com";
	private static final String TEST_PASSWORD = "testPassword123";
	private static final String TEST_DISPLAY_NAME = "testDisplayName";

	private void performSignupTest(SignupRequestDTO dto, boolean shouldSucceed) throws Exception {
		if (shouldSucceed) {
			when(memberService.signup(any())).thenReturn(
				new SignupResponseDTO(
					UUID.randomUUID(),
					dto.getUsername(),
					dto.getDisplayName()
				)
			);

			mockMvc.perform(post("/members/v1/signup")
					.contentType(MediaType.APPLICATION_JSON)
					.content(objectMapper.writeValueAsString(dto)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.username").value(dto.getUsername()));
		} else {
			mockMvc.perform(post("/members/v1/signup")
					.contentType(MediaType.APPLICATION_JSON)
					.content(objectMapper.writeValueAsString(dto)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error.message").exists());
		}
	}

	@ParameterizedTest
	@MethodSource("usernameTestProvider")
	@DisplayName("아이디 검증 테스트")
	void signupUsernameTest(String username, boolean shouldSucceed) throws Exception {
		SignupRequestDTO dto = SignupRequestDTO.builder()
			.username(username)
			.password(TEST_PASSWORD)
			.email(TEST_EMAIL)
			.displayName(TEST_DISPLAY_NAME)
			.build();

		performSignupTest(dto, shouldSucceed);
	}

	@ParameterizedTest
	@MethodSource("passwordTestProvider")
	@DisplayName("비밀번호 검증 테스트")
	void signupPasswordTest(String password, boolean shouldSucceed) throws Exception {
		SignupRequestDTO dto = SignupRequestDTO.builder()
			.username(TEST_USERNAME)
			.password(password)
			.email(TEST_EMAIL)
			.displayName(TEST_DISPLAY_NAME)
			.build();

		performSignupTest(dto, shouldSucceed);
	}

	@ParameterizedTest
	@MethodSource("displayNameTestProvider")
	@DisplayName("닉네임 검증 테스트")
	void signupDisplayNameTest(String displayName, boolean shouldSucceed) throws Exception {
		SignupRequestDTO dto = SignupRequestDTO.builder()
			.username(TEST_USERNAME)
			.password(TEST_PASSWORD)
			.email(TEST_EMAIL)
			.displayName(displayName)
			.build();

		performSignupTest(dto, shouldSucceed);
	}

	static Stream<Arguments> usernameTestProvider() {
		return Stream.of(
			Arguments.of(null, false),
			Arguments.of("aaa", false),
			Arguments.of("aaaa", true),
			Arguments.of("a".repeat(12), true),
			Arguments.of("a".repeat(13), false),

			Arguments.of("test_user", true),
			Arguments.of("test.user", true),
			Arguments.of("test-user", true),
			Arguments.of("test123", true),
			Arguments.of("TEST", true),
			Arguments.of("test@user", false),
			Arguments.of("test user", false),
			Arguments.of("test#user", false),
			Arguments.of("테스트", false),
			Arguments.of("test!user", false)
		);
	}

	static Stream<Arguments> passwordTestProvider() {
		return Stream.of(
			Arguments.of(null, false),
			Arguments.of("aaa", false),
			Arguments.of("aaaa", true),
			Arguments.of("a".repeat(20), true),
			Arguments.of("a".repeat(21), false),

			Arguments.of("pass_word", true),
			Arguments.of("pass.word", true),
			Arguments.of("pass-word", true),
			Arguments.of("Pass123", true),
			Arguments.of("PASS", true),
			Arguments.of("pass@word", false),
			Arguments.of("pass word", false),
			Arguments.of("pass#word", false),
			Arguments.of("비밀번호", false),
			Arguments.of("pass!word", false)
		);
	}

	static Stream<Arguments> displayNameTestProvider() {
		return Stream.of(
			Arguments.of("a", false),
			Arguments.of("aa", true),
			Arguments.of("a".repeat(20), true),
			Arguments.of("a".repeat(21), false)
		);
	}

	@Test
	@DisplayName("로그아웃 성공 테스트")
	void logoutSuccess() throws Exception {
		mockMvc.perform(delete("/members/v1/logout"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.message").value("로그아웃 되었습니다."))
			.andExpect(header().exists(HttpHeaders.SET_COOKIE))
			.andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("auth_token=")))
			.andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("Max-Age=0")))
			.andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("HttpOnly")))
			.andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("Secure")))
			.andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("SameSite=Strict")));
	}
}
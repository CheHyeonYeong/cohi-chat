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

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.member.request.LoginRequestDTO;
import com.coDevs.cohiChat.member.request.SignupRequestDTO;
import com.coDevs.cohiChat.member.request.UpdateMemberRequestDTO;
import com.coDevs.cohiChat.member.response.HostResponseDTO;
import com.coDevs.cohiChat.member.response.LoginResponseDTO;
import com.coDevs.cohiChat.member.response.MemberResponseDTO;
import com.coDevs.cohiChat.member.response.SignupResponseDTO;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(MemberController.class)
// Security 필터를 비활성화하여 @PreAuthorize 없이 순수 응답 형식만 테스트
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

	@Nested
	@DisplayName("회원가입 API")
	class Signup {

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
					.andExpect(jsonPath("$.success").value(true))
					.andExpect(jsonPath("$.data.username").value(dto.getUsername()))
					.andExpect(jsonPath("$.error").isEmpty());
			} else {
				mockMvc.perform(post("/members/v1/signup")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(dto)))
					.andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.success").value(false))
					.andExpect(jsonPath("$.error.message").exists());
			}
		}

		@ParameterizedTest
		@MethodSource("com.coDevs.cohiChat.member.MemberControllerTest#usernameTestProvider")
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
		@MethodSource("com.coDevs.cohiChat.member.MemberControllerTest#passwordTestProvider")
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
		@MethodSource("com.coDevs.cohiChat.member.MemberControllerTest#displayNameTestProvider")
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
	}

	@Nested
	@DisplayName("로그인 API")
	class Login {

		@Test
		@DisplayName("로그인 성공 응답 형식 검증")
		void loginSuccess() throws Exception {
			LoginResponseDTO loginResponse = LoginResponseDTO.builder()
				.accessToken("test-access-token")
				.expiredInMinutes(60)
				.username(TEST_USERNAME)
				.displayName(TEST_DISPLAY_NAME)
				.build();

			when(memberService.login(any())).thenReturn(loginResponse);

			mockMvc.perform(post("/members/v1/login")
					.contentType(MediaType.APPLICATION_JSON)
					.content(objectMapper.writeValueAsString(
						LoginRequestDTO.builder()
							.username(TEST_USERNAME)
							.password(TEST_PASSWORD)
							.build())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.accessToken").value("test-access-token"))
				.andExpect(jsonPath("$.data.username").value(TEST_USERNAME))
				.andExpect(jsonPath("$.error").isEmpty());
		}
	}

	@Nested
	@DisplayName("로그아웃 API")
	class Logout {

		@Test
		@DisplayName("로그아웃 성공 응답 형식 검증")
		void logoutSuccess() throws Exception {
			mockMvc.perform(delete("/members/v1/logout"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.message").value("로그아웃 되었습니다."))
				.andExpect(jsonPath("$.error").isEmpty());
		}
	}

	@Nested
	@DisplayName("회원 조회 API")
	class GetMember {

		@Test
		@DisplayName("회원 조회 성공 응답 형식 검증")
		void getMemberSuccess() throws Exception {
			Member member = Member.create(TEST_USERNAME, TEST_DISPLAY_NAME, TEST_EMAIL, "hashedPassword", Role.GUEST);
			when(memberService.getMember(TEST_USERNAME)).thenReturn(member);

			mockMvc.perform(get("/members/v1/{username}", TEST_USERNAME))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.username").value(TEST_USERNAME))
				.andExpect(jsonPath("$.data.displayName").value(TEST_DISPLAY_NAME))
				.andExpect(jsonPath("$.error").isEmpty());
		}
	}

	@Nested
	@DisplayName("회원 수정 API")
	class UpdateMember {

		@Test
		@DisplayName("회원 수정 성공 응답 형식 검증")
		void updateMemberSuccess() throws Exception {
			MemberResponseDTO responseDTO = MemberResponseDTO.builder()
				.id(UUID.randomUUID())
				.username(TEST_USERNAME)
				.displayName("newNick")
				.email(TEST_EMAIL)
				.role(Role.GUEST)
				.createdAt(LocalDateTime.now())
				.updatedAt(LocalDateTime.now())
				.build();

			when(memberService.updateMember(anyString(), any())).thenReturn(responseDTO);

			mockMvc.perform(patch("/members/v1/{username}", TEST_USERNAME)
					.contentType(MediaType.APPLICATION_JSON)
					.content(objectMapper.writeValueAsString(
						UpdateMemberRequestDTO.builder()
							.displayName("newNick")
							.build())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.username").value(TEST_USERNAME))
				.andExpect(jsonPath("$.data.displayName").value("newNick"))
				.andExpect(jsonPath("$.error").isEmpty());
		}
	}

	@Nested
	@DisplayName("회원 삭제 API")
	class DeleteMember {

		@Test
		@DisplayName("회원 삭제 성공 - 204 No Content")
		void deleteMemberSuccess() throws Exception {
			doNothing().when(memberService).deleteMember(TEST_USERNAME);

			mockMvc.perform(delete("/members/v1/{username}", TEST_USERNAME))
				.andExpect(status().isNoContent());
		}
	}

	@Nested
	@DisplayName("호스트 목록 조회 API")
	class GetHosts {

		@Test
		@DisplayName("호스트 목록 조회 성공 응답 형식 검증")
		void getHostsSuccess() throws Exception {
			List<HostResponseDTO> hosts = List.of(
				HostResponseDTO.builder().username("host1").displayName("Host One").build(),
				HostResponseDTO.builder().username("host2").displayName("Host Two").build()
			);

			when(memberService.getActiveHosts()).thenReturn(hosts);

			mockMvc.perform(get("/members/v1/hosts"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data[0].username").value("host1"))
				.andExpect(jsonPath("$.data[1].username").value("host2"))
				.andExpect(jsonPath("$.error").isEmpty());
		}
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
		mockMvc.perform(delete("/members/v1/logout")
				.principal(() -> TEST_USERNAME))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.success").value(true))
			.andExpect(jsonPath("$.data.message").value("로그아웃 되었습니다."));
	}
}

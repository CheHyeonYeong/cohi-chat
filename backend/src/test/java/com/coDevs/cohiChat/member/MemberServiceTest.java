package com.coDevs.cohiChat.member;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.global.security.jwt.JwtTokenProvider;
import com.coDevs.cohiChat.member.entity.Provider;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.member.request.DeleteMemberRequestDTO;
import com.coDevs.cohiChat.member.request.LoginRequestDTO;
import com.coDevs.cohiChat.member.request.SignupRequestDTO;
import com.coDevs.cohiChat.member.request.UpdateMemberRequestDTO;
import com.coDevs.cohiChat.member.response.LoginResponseDTO;
import com.coDevs.cohiChat.member.response.SignupResponseDTO;

@ExtendWith(MockitoExtension.class)
class MemberServiceTest {

	private Member member;

	@Mock
	private MemberRepository memberRepository;

	@Mock
	private PasswordEncoder passwordEncoder;

	@InjectMocks
	private MemberService memberService;

	@Mock
	private JwtTokenProvider jwtTokenProvider;

	@BeforeEach
	void setUp() {

		member = Member.create("test", "testNick", "test@test.com", "hashedPassword", Role.GUEST);
	}

	/**
	 * 공통 헬퍼 메서드:
	 * null 전달 시 유연하게 대응하도록 수정했습니다.
	 */
	private static <T> T createRequest(String username, String email, String password, String displayName, Class<T> type) {
		String finalUser = (username != null) ? username : "test";
		String finalEmail = (email != null) ? email : "test@test.com";
		String finalPass = (password != null) ? password : "password123";

		String finalNick = displayName;

		if (type.equals(SignupRequestDTO.class)) {
			return type.cast(SignupRequestDTO.builder()
				.username(finalUser).email(finalEmail).password(finalPass).displayName(finalNick)
				.provider(Provider.LOCAL).role(Role.GUEST).build());
		}
		if (type.equals(LoginRequestDTO.class)) {
			return type.cast(LoginRequestDTO.builder().username(finalUser).password(finalPass).build());
		}
		if (type.equals(UpdateMemberRequestDTO.class)) {
			return type.cast(UpdateMemberRequestDTO.builder().username(finalUser).displayName(finalNick).password(finalPass).build());
		}
		if (type.equals(DeleteMemberRequestDTO.class)) {
			return type.cast(new DeleteMemberRequestDTO(finalUser));
		}
		throw new IllegalArgumentException("Unsupported DTO type");
	}

	@Test
	@DisplayName("성공: 모든 입력 항목이 존재하면 계정 생성")
	void signupSuccess() {
		SignupRequestDTO request = createRequest("testuser", null, null, "testNick", SignupRequestDTO.class);

		given(memberRepository.existsByUsername(any())).willReturn(false);
		given(memberRepository.existsByEmail(any())).willReturn(false);
		given(passwordEncoder.encode(any())).willReturn("hashedPassword");
		given(memberRepository.save(any(Member.class))).willAnswer(inv -> inv.getArgument(0));

		SignupResponseDTO result = memberService.signup(request);
		assertThat(result.getUsername()).isEqualTo("testuser");
	}

	@Test
	@DisplayName("성공: 표시명이 없으면(null) 무작위 문자열 8글자 생성")
	void signupWithRandomDisplayName() {

		SignupRequestDTO request = createRequest("testuser", null, null, null, SignupRequestDTO.class);

		given(memberRepository.existsByUsername(any())).willReturn(false);
		given(memberRepository.existsByEmail(any())).willReturn(false);
		given(passwordEncoder.encode(any())).willReturn("hash");
		given(memberRepository.save(any(Member.class))).willAnswer(inv -> inv.getArgument(0));

		SignupResponseDTO result = memberService.signup(request);

		assertThat(result.getDisplayName()).isNotNull();
		assertThat(result.getDisplayName().length()).isEqualTo(8);
	}

	@Test
	@DisplayName("실패: 사용자명이 4자 미만일 때")
	void signupUsernameMinBoundaryFail() {
		SignupRequestDTO request = createRequest("abc", null, null, "nick", SignupRequestDTO.class);

		assertThatThrownBy(() -> memberService.signup(request))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode").isEqualTo(ErrorCode.INVALID_USERNAME);
	}

	@Test
	@DisplayName("성공: 사용자명이 경계값(12자)인 경우")
	void signupUsernameBoundarySuccess() {
		String maxUsername = "a".repeat(12);
		SignupRequestDTO request = createRequest(maxUsername, null, null, "testNick", SignupRequestDTO.class);

		given(memberRepository.existsByUsername(maxUsername)).willReturn(false);
		given(memberRepository.existsByEmail(any())).willReturn(false);
		given(passwordEncoder.encode(any())).willReturn("hash");
		given(memberRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

		SignupResponseDTO result = memberService.signup(request);
		assertThat(result.getUsername().length()).isEqualTo(12);
	}

	@Test
	@DisplayName("실패: 사용자명이 경계값(12자)을 초과할 때")
	void signupUsernameMaxBoundaryFail() {
		String tooLongUsername = "a".repeat(13);
		SignupRequestDTO request = createRequest(tooLongUsername, null, null, "testNick", SignupRequestDTO.class);

		assertThatThrownBy(() -> memberService.signup(request))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode").isEqualTo(ErrorCode.INVALID_USERNAME);
	}

	@Test
	@DisplayName("실패: 계정 id가 중복되면 오류")
	void signupFailWithDuplicateUsername() {
		SignupRequestDTO request = createRequest("dupUser", null, null, "testNick", SignupRequestDTO.class);
		given(memberRepository.existsByUsername("dupUser")).willReturn(true);

		assertThatThrownBy(() -> memberService.signup(request))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode").isEqualTo(ErrorCode.DUPLICATED_USERNAME);
	}

	@Test
	@DisplayName("성공: 로그인 성공")
	void loginSuccess() {
		ReflectionTestUtils.setField(memberService, "accessTokenExpiration", 3600000L);
		LoginRequestDTO request = createRequest("test", null, "password123", "testNick", LoginRequestDTO.class);

		given(memberRepository.findByUsername("test")).willReturn(Optional.of(member));
		given(passwordEncoder.matches("password123", "hashedPassword")).willReturn(true);
		given(jwtTokenProvider.createAccessToken(any(), any())).willReturn("test-access-token");

		LoginResponseDTO response = memberService.login(request);
		assertThat(response.getAccessToken()).isEqualTo("test-access-token");
	}

	@Test
	@DisplayName("성공: 존재하는 아이디로 회원 정보 조회")
	void getMemberSuccess() {
		given(memberRepository.findByUsername("test")).willReturn(Optional.of(member));
		Member result = memberService.getMember("test");
		assertThat(result.getUsername()).isEqualTo("test");
	}

	@Test
	@DisplayName("성공: 닉네임과 비밀번호 모두 수정")
	void updateMemberSuccess() {
		UpdateMemberRequestDTO request = createRequest("test", null, "newPass", "newNick", UpdateMemberRequestDTO.class);

		given(memberRepository.findByUsername("test")).willReturn(Optional.of(member));
		given(passwordEncoder.encode("newPass")).willReturn("newHash");

		memberService.updateMember(request);
		assertThat(member.getDisplayName()).isEqualTo("newNick");
		assertThat(member.getHashedPassword()).isEqualTo("newHash");
	}

	@Test
	@DisplayName("성공: 닉네임만 변경 시 비밀번호 유지")
	void updateMemberOnlyDisplayName() {
		String oldPassword = member.getHashedPassword();
		UpdateMemberRequestDTO request = createRequest("test", null, null, "newNick", UpdateMemberRequestDTO.class);

		ReflectionTestUtils.setField(request, "password", null);

		given(memberRepository.findByUsername("test")).willReturn(Optional.of(member));

		memberService.updateMember(request);
		assertThat(member.getDisplayName()).isEqualTo("newNick");
		assertThat(member.getHashedPassword()).isEqualTo(oldPassword);
		verify(passwordEncoder, never()).encode(anyString());
	}

	@Test
	@DisplayName("성공: 비밀번호 변경 시 닉네임 유지")
	void updateMemberOnlyPassword() {
		String oldNickname = member.getDisplayName();
		UpdateMemberRequestDTO request = createRequest("test", null, "newPass", null, UpdateMemberRequestDTO.class);

		ReflectionTestUtils.setField(request, "displayName", null);

		given(memberRepository.findByUsername("test")).willReturn(Optional.of(member));
		given(passwordEncoder.encode("newPass")).willReturn("newHash");

		memberService.updateMember(request);
		assertThat(member.getDisplayName()).isEqualTo(oldNickname);
		assertThat(member.getHashedPassword()).isEqualTo("newHash");
	}

	@Test
	@DisplayName("성공: 회원 삭제")
	void deleteMemberSuccess() {
		DeleteMemberRequestDTO request = createRequest("test", null, null, null, DeleteMemberRequestDTO.class);

		given(memberRepository.findByUsername("test")).willReturn(Optional.of(member));

		memberService.deleteMember(request);

		verify(memberRepository, times(1)).delete(member);
	}
}
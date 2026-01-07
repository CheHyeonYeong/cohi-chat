package com.coDevs.cohiChat.member.service;

import static com.coDevs.cohiChat.member.fixture.MemberFixture.*;
import static org.assertj.core.api.AssertionsForClassTypes.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.global.util.NicknameGenerator;
import com.coDevs.cohiChat.member.MemberService;
import com.coDevs.cohiChat.member.request.CreateMemberRequestDTO;
import com.coDevs.cohiChat.member.response.CreateMemberResponseDTO;
import com.coDevs.cohiChat.member.response.MemberResponseDTO;
import com.coDevs.cohiChat.member.request.UpdateMemberRequestDTO;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.mapper.MemberMapper;
import com.coDevs.cohiChat.member.MemberRepository;

@ExtendWith(MockitoExtension.class)
class MemberServiceTest {
	@Mock
	private MemberRepository memberRepository;

	@Mock
	private PasswordEncoder passwordEncoder;

	@Mock
	private MemberMapper memberMapper;

	@InjectMocks
	private MemberService memberService;

	@Mock
	private NicknameGenerator nicknameGenerator;

	@Test
	@DisplayName("성공: 유효한 정보로 회원가입 시 응답 DTO를 반환한다")
	void signupSuccess() {

		CreateMemberRequestDTO request = new CreateMemberRequestDTO(
			"testuser",
			"test_nickname",
			"test@test.com",
			"pw123",
			false
		);

		given(memberRepository
			.existsByUsername(anyString()))
			.willReturn(false);
		given(memberRepository
			.existsByEmail(anyString())
		).willReturn(false);
		given(passwordEncoder
			.encode(anyString()))
			.willReturn("ENCODED_PW");

		Member savedMember = create(
			"testuser",
			"test_nickname",
			"test@test.com",
			false
		);

		given(memberRepository
			.save(any(Member.class)))
			.willReturn(savedMember);

		CreateMemberResponseDTO expected = new CreateMemberResponseDTO(
			UUID.randomUUID(), "testuser", "test_nickname", "test@test.com", false, LocalDateTime.now(), LocalDateTime.now()
		);
		given(memberMapper.toSignupResponse(any(Member.class)))
			.willReturn(new CreateMemberResponseDTO(
				UUID.randomUUID(), "testuser", "test_nickname", "test@test.com", false,
				LocalDateTime.now(), LocalDateTime.now()
			));

		CreateMemberResponseDTO result = memberService.signUp(request);

		assertThat(result)
			.isNotNull()
			.extracting(CreateMemberResponseDTO::username, CreateMemberResponseDTO::email, CreateMemberResponseDTO::displayName)
			.containsExactly("testuser", "test@test.com", "test_nickname");

		assertThat(result.isHost()).isFalse();


		then(memberRepository)
			.should(times(1)).save(any(Member.class));
	}

	@Test
	@DisplayName("실패: 아이디 중복 시 DUPLICATED_USERNAME_ERROR 예외가 발생한다")
	void signupFailDuplicateUsername() {

		CreateMemberRequestDTO request = new CreateMemberRequestDTO(
			"testuser",
			"nick",
			"test@test.com",
			"pw123",
			false
		);
		given(memberRepository
			.existsByUsername("testuser")).willReturn(true);


		assertThatThrownBy(() -> memberService.signUp(request))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode") // CustomException 내의 errorCode 필드 추출
			.isEqualTo(ErrorCode.DUPLICATED_USERNAME);


		then(memberRepository)
			.should(never()).existsByEmail(anyString());
		then(memberRepository)
			.should(never()).save(any());
	}

	@Test
	@DisplayName("실패: 이메일 중복 시 DUPLICATED_EMAIL_ERROR 예외가 발생한다")
	void signupFailDuplicateEmail() {

		CreateMemberRequestDTO request = new CreateMemberRequestDTO(
			"testuser",
			"nick",
			"test@test.com",
			"pw123",
			false
		);
		given(memberRepository
			.existsByUsername("testuser")).willReturn(false);
		given(memberRepository
			.existsByEmail("test@test.com")).willReturn(true);

		assertThatThrownBy(() -> memberService.signUp(request))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.DUPLICATED_EMAIL);

		then(memberRepository).should(never()).save(any());
	}

	@Test
	@DisplayName("성공: 표시명을 입력하지 않으면 자동으로 생성된다")
	void signupSuccessGenerateDisplayNameWhenNull() {

		CreateMemberRequestDTO request = new CreateMemberRequestDTO(
			"testuser",
			null,
			"test@test.com",
			"pw123",
			false
		);

		given(memberRepository.existsByUsername(anyString())).willReturn(false);
		given(memberRepository.existsByEmail(anyString())).willReturn(false);
		given(passwordEncoder.encode(anyString())).willReturn("ENCODED_PW");

		String mockNickname = "포근한 카페 방문자";
		given(nicknameGenerator.generate()).willReturn(mockNickname);

		given(memberRepository.save(any(Member.class)))
			.willAnswer(inv -> inv.getArgument(0));

		given(memberMapper.toSignupResponse(any(Member.class)))
			.willAnswer(inv -> {
				Member member = inv.getArgument(0);
				return new CreateMemberResponseDTO(
					UUID.randomUUID(),
					member.getUsername(),
					member.getDisplayName(), // 여기서 mockNickname이 담긴 member를 사용하게 됨
					member.getEmail(),
					member.isHost(),
					LocalDateTime.now(),
					LocalDateTime.now()
				);
			});

		CreateMemberResponseDTO result = memberService.signUp(request);

		assertThat(result.displayName())
			.isNotNull()
			.isEqualTo(mockNickname);

		verify(nicknameGenerator, times(1)).generate();
	}

	@Test
	@DisplayName("성공: username으로 사용자를 조회하면 MemberResponseDTO를 반환한다")
	void getByUsernameSuccess() {

		Member member = withId(UUID.randomUUID());

		MemberResponseDTO response = new MemberResponseDTO(
			UUID.randomUUID(), "testuser", "nickname", "test@test.com", false,
			LocalDateTime.now(), LocalDateTime.now()
		);

		given(memberRepository.findByUsername("testuser"))
			.willReturn(Optional.of(member));
		given(memberMapper.toResponse(member))
			.willReturn(response);

		MemberResponseDTO result = memberService.getByUsername("testuser");

		assertThat(result)
			.extracting(
				MemberResponseDTO::username,
				MemberResponseDTO::email,
				MemberResponseDTO::displayName,
				MemberResponseDTO::isHost
			)
			.containsExactly(
				"testuser",
				"test@test.com",
				"nickname",
				false
			);

		then(memberRepository).should().findByUsername("testuser");
		then(memberMapper).should().toResponse(member);
	}

	@Test
	@DisplayName("실패: 존재하지 않는 username으로 조회하면 USER_NOT_FOUND_ERROR가 발생한다")
	void getByUsernameFailUserNotFound() {

		given(memberRepository.findByUsername("testuser"))
			.willReturn(Optional.empty());

		assertThatThrownBy(() -> memberService.getByUsername("testuser"))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode")
			.isEqualTo(ErrorCode.USER_NOT_FOUND);

		then(memberMapper).shouldHaveNoInteractions();
	}

	@Test
	@DisplayName("성공: displayName과 password를 수정하면 변경된 정보가 반환된다")
	void updateMemberSuccess() {

		Member member = withId(UUID.randomUUID());

		UpdateMemberRequestDTO request = new UpdateMemberRequestDTO(
			"newName",
			"newPassword"
		);

		MemberResponseDTO response = new MemberResponseDTO(
			UUID.randomUUID(), "testuser", "newName", "test@test.com", false,
			LocalDateTime.now(), LocalDateTime.now()
		);

		given(memberRepository.findByUsername("testuser"))
			.willReturn(Optional.of(member));
		given(passwordEncoder.encode("newPassword"))
			.willReturn("ENCODED_PW");
		given(memberMapper.toResponse(member))
			.willReturn(response);

		MemberResponseDTO result = memberService.updateMember("testuser", request);

		assertThat(result.displayName()).isEqualTo("newName");

		then(passwordEncoder).should().encode("newPassword");
		then(memberRepository).should(never()).save(any());
		then(memberMapper).should().toResponse(member);
	}

	@Test
	@DisplayName("실패: 수정 시 username이 존재하지 않으면 USER_NOT_FOUND_ERROR가 발생한다")
	void updateMemberFailUserNotFound() {

		UpdateMemberRequestDTO request = new UpdateMemberRequestDTO(
			"newName",
			"newPassword"
		);

		given(memberRepository.findByUsername("testuser"))
			.willReturn(Optional.empty());

		assertThatThrownBy(() -> memberService.updateMember("testuser", request))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode")
			.isEqualTo(ErrorCode.USER_NOT_FOUND);

		then(passwordEncoder).shouldHaveNoInteractions();
		then(memberMapper).shouldHaveNoInteractions();
	}

	@Test
	@DisplayName("성공: 회원 탈퇴 시 해당 회원이 삭제된다")
	void deleteMemberSuccess() {

		Member member = withId(UUID.randomUUID());

		given(memberRepository.findByUsername("testuser"))
			.willReturn(Optional.of(member));

		memberService.deleteMe("testuser");

		then(memberRepository).should().delete(member);
	}

	@Test
	@DisplayName("실패: 존재하지 않는 회원을 탈퇴하면 USER_NOT_FOUND_ERROR가 발생한다")
	void deleteMemberFailUserNotFound() {

		given(memberRepository.findByUsername("testuser"))
			.willReturn(Optional.empty());

		assertThatThrownBy(() -> memberService.deleteMe("testuser"))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode")
			.isEqualTo(ErrorCode.USER_NOT_FOUND);

		then(memberRepository).should(never()).delete(any());
	}

}
package com.coDevs.cohiChat.member.service;

import static org.assertj.core.api.AssertionsForClassTypes.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.dto.CreateMemberRequestDTO;
import com.coDevs.cohiChat.member.dto.CreateMemberResponseDTO;
import com.coDevs.cohiChat.member.dto.MemberResponseDTO;
import com.coDevs.cohiChat.member.dto.UpdateMemberRequestDTO;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.mapper.MemberMapper;
import com.coDevs.cohiChat.member.repository.MemberRepository;

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

	@Test
	@DisplayName("성공: 유효한 정보로 회원가입 시 응답 DTO를 반환한다")
	void signupSuccess() {

		CreateMemberRequestDTO request = new CreateMemberRequestDTO(
			"testuser",
			"test_nickname",
			"test@test.com",
			"pw123",
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

		Member savedMember = Member.create(
			"testuser",
			"test_nickname",
			"test@test.com",
			"ENCODED_PW",
			false);

		given(memberRepository
			.save(any(Member.class)))
			.willReturn(savedMember);

		CreateMemberResponseDTO expected = new CreateMemberResponseDTO(
			1L, "testuser", "test_nickname", "test@test.com", false, LocalDateTime.now(), LocalDateTime.now()
		);
		given(memberMapper.toSignupResponse(any(Member.class)))
			.willReturn(expected);


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
			"pw123",
			false
		);
		given(memberRepository
			.existsByUsername("testuser")).willReturn(true);


		assertThatThrownBy(() -> memberService.signUp(request))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode") // CustomException 내의 errorCode 필드 추출
			.isEqualTo(ErrorCode.DUPLICATED_USERNAME_ERROR);


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
			"pw123",
			false
		);
		given(memberRepository
			.existsByUsername("testuser")).willReturn(false);
		given(memberRepository
			.existsByEmail("test@test.com")).willReturn(true);

		assertThatThrownBy(() -> memberService.signUp(request))
			.isInstanceOf(CustomException.class)
			.hasFieldOrPropertyWithValue("errorCode", ErrorCode.DUPLICATED_EMAIL_ERROR);

		then(memberRepository).should(never()).save(any());
	}

	@Test
	@DisplayName("성공: 표시명을 입력하지 않으면 자동으로 생성된다")
	void signupSuccess_generateDisplayNameWhenNull() {

		CreateMemberRequestDTO request = new CreateMemberRequestDTO(
			"testuser",
			null,
			"test@test.com",
			"pw123",
			"pw123",
			false
		);

		given(memberRepository.existsByUsername(anyString())).willReturn(false);
		given(memberRepository.existsByEmail(anyString())).willReturn(false);
		given(passwordEncoder.encode(anyString())).willReturn("ENCODED_PW");

		given(memberRepository.save(any(Member.class)))
			.willAnswer(inv -> inv.getArgument(0));

		given(memberMapper.toSignupResponse(any(Member.class)))
			.willAnswer(inv -> {
				Member member = inv.getArgument(0);

				return new CreateMemberResponseDTO(
					1L,
					member.getUsername(),
					member.getDisplayName(),
					member.getEmail(),
					member.isHost(),
					LocalDateTime.now(),
					LocalDateTime.now()
				);
			});

		CreateMemberResponseDTO result = memberService.signUp(request);

		assertThat(result.displayName())
			.isNotNull()
			.hasSize(8);
	}

	@Test
	@DisplayName("성공: username으로 사용자를 조회하면 MemberResponseDTO를 반환한다")
	void getByUsername_success() {

		Member member = Member.builder()
			.id(1L)
			.username("testuser")
			.email("test@test.com")
			.displayName("oldName")
			.hashedPassword("OLD_PW")
			.isHost(false)
			.createdAt(LocalDateTime.now().minusDays(1))
			.updatedAt(LocalDateTime.now().minusDays(1))
			.build();

		MemberResponseDTO response = new MemberResponseDTO(
			1L, "testuser", "nickname", "test@test.com", false,
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
	void getByUsername_fail_userNotFound() {

		given(memberRepository.findByUsername("testuser"))
			.willReturn(Optional.empty());

		assertThatThrownBy(() -> memberService.getByUsername("testuser"))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode")
			.isEqualTo(ErrorCode.USER_NOT_FOUND_ERROR);

		then(memberMapper).shouldHaveNoInteractions();
	}

	// ================= 3. 사용자 정보 수정 =================

	@Test
	@DisplayName("성공: displayName과 password를 수정하면 변경된 정보가 반환된다")
	void updateMember_success() {

		Member member = Member.builder()
			.id(1L)
			.username("testuser")
			.email("test@test.com")
			.displayName("oldName")
			.hashedPassword("OLD_PW")
			.isHost(false)
			.createdAt(LocalDateTime.now().minusDays(1))
			.updatedAt(LocalDateTime.now().minusDays(1))
			.build();

		UpdateMemberRequestDTO request = new UpdateMemberRequestDTO(
			"newName",
			"newPassword"
		);

		MemberResponseDTO response = new MemberResponseDTO(
			1L, "testuser", "newName", "test@test.com", false,
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
	void updateMember_fail_userNotFound() {

		UpdateMemberRequestDTO request = new UpdateMemberRequestDTO(
			"newName",
			"newPassword"
		);

		given(memberRepository.findByUsername("testuser"))
			.willReturn(Optional.empty());

		assertThatThrownBy(() -> memberService.updateMember("testuser", request))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode")
			.isEqualTo(ErrorCode.USER_NOT_FOUND_ERROR);

		then(passwordEncoder).shouldHaveNoInteractions();
		then(memberMapper).shouldHaveNoInteractions();
	}

	// ================= 4. 회원 탈퇴 =================

	@Test
	@DisplayName("성공: 회원 탈퇴 시 해당 회원이 삭제된다")
	void deleteMember_success() {

		Member member = Member.builder()
			.id(1L)
			.username("testuser")
			.build();

		given(memberRepository.findByUsername("testuser"))
			.willReturn(Optional.of(member));

		memberService.deleteMe("testuser");

		then(memberRepository).should().delete(member);
	}

	@Test
	@DisplayName("실패: 존재하지 않는 회원을 탈퇴하면 USER_NOT_FOUND_ERROR가 발생한다")
	void deleteMember_fail_userNotFound() {

		given(memberRepository.findByUsername("testuser"))
			.willReturn(Optional.empty());

		assertThatThrownBy(() -> memberService.deleteMe("testuser"))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode")
			.isEqualTo(ErrorCode.USER_NOT_FOUND_ERROR);

		then(memberRepository).should(never()).delete(any());
	}

}
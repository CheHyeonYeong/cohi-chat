package com.coDevs.cohiChat.member;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.member.request.UpdateMemberRequestDTO;

@ExtendWith(MockitoExtension.class)
class MemberServiceTest {

	@Mock
	private MemberRepository memberRepository;

	@Mock
	private PasswordEncoder passwordEncoder;

	@InjectMocks
	private MemberService memberService;

	private Member member;

	@BeforeEach
	void setUp() {
		member = Member.create(
			"test",
			"testNickname",
			"test@test.com",
			"hashPassword",
			Role.GUEST
		);
	}

	@Test
	@DisplayName("성공: username으로 회원 조회")
	void getMemberSuccess() {

		given(memberRepository.findByUsername("test"))
			.willReturn(Optional.of(member));

		Member result = memberService.getMember("test");

		assertThat(result.getUsername())
			.isEqualTo("test");
	}

	@Test
	@DisplayName("실패: 존재하지 않는 username 조회")
	void getMemberFail() {

		given(memberRepository.findByUsername("none"))
			.willReturn(Optional.empty());


		assertThatThrownBy(() -> memberService.getMember("none"))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode")
			.isEqualTo(ErrorCode.USER_NOT_FOUND);
	}

	@Test
	@DisplayName("성공: 회원 정보 수정")
	void updateMemberSuccess() {

		UpdateMemberRequestDTO request = new UpdateMemberRequestDTO("newName", "newPassword");

		given(memberRepository.findByUsername("test"))
			.willReturn(Optional.of(member));

		given(passwordEncoder.encode("newPassword"))
			.willReturn("newHashedPassword");

		Member result = memberService.updateMember("test", request);

		assertThat(result.getDisplayName()).isEqualTo("newName");
		assertThat(result.getHashedPassword()).isEqualTo("newHashedPassword");
	}

	@Test
	@DisplayName("성공: 닉네임만 수정하고 비밀번호는 유지")
	void updateMemberOnlyDisplayName() {

		UpdateMemberRequestDTO request = new UpdateMemberRequestDTO("onlyNewName", null);
		String originalHash = member.getHashedPassword(); // "hashPassword"

		given(memberRepository.findByUsername("test"))
			.willReturn(Optional.of(member));

		Member result = memberService.updateMember("test", request);

		assertThat(result.getDisplayName()).isEqualTo("onlyNewName");
		assertThat(result.getHashedPassword()).isEqualTo(originalHash);

		then(passwordEncoder).shouldHaveNoInteractions();
	}

	@Test
	@DisplayName("성공: 비밀번호만 수정하고 닉네임은 유지")
	void updateMemberOnlyPassword() {

		UpdateMemberRequestDTO request = new UpdateMemberRequestDTO(null, "newPassword");
		String originalDisplayName = member.getDisplayName();

		given(memberRepository.findByUsername("test"))
			.willReturn(Optional.of(member));
		given(passwordEncoder.encode("newPassword"))
			.willReturn("newHashedPassword");

		Member result = memberService.updateMember("test", request);

		assertThat(result.getDisplayName()).isEqualTo(originalDisplayName); // 기존 닉네임 유지 확인
		assertThat(result.getHashedPassword()).isEqualTo("newHashedPassword");
	}

	@Test
	@DisplayName("실패: 수정 시 회원 없음")
	void updateMemberFail() {

		given(memberRepository.findByUsername("none"))
			.willReturn(Optional.empty());

		assertThatThrownBy(() -> memberService.updateMember("none",
			new UpdateMemberRequestDTO("a", "b")))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode")
			.isEqualTo(ErrorCode.USER_NOT_FOUND);
	}

	@Test
	@DisplayName("성공: 회원 삭제")
	void deleteMemberSuccess() {
		// Given
		given(memberRepository.findByUsername("test"))
			.willReturn(Optional.of(member));

		memberService.deleteMember("test");

		then(memberRepository).should()
			.delete(member);
	}

	@Test
	@DisplayName("실패: 회원 삭제 - 없음")
	void deleteMemberFail() {
		// Given
		given(memberRepository.findByUsername("none"))
			.willReturn(Optional.empty());

		assertThatThrownBy(() -> memberService.deleteMember("none"))
			.isInstanceOf(CustomException.class)
			.extracting("errorCode")
			.isEqualTo(ErrorCode.USER_NOT_FOUND);
	}
}
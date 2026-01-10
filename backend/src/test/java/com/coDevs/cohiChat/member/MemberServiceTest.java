package com.coDevs.cohiChat.member;

import static org.assertj.core.api.AssertionsForClassTypes.*;
import static org.mockito.BDDMockito.*;

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
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.member.request.UpdateMemberRequestDTO;
import com.coDevs.cohiChat.member.entity.Member;

@ExtendWith(MockitoExtension.class)
class MemberServiceTest {
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
				"test_nickname",
				"test@test.com",
				"hash_pw",
				Role.GUEST
			);
		}

		@Test
		@DisplayName("성공: username으로 회원 조회")
		void getByUsernameSuccess() {
			given(memberRepository.findByUsername("test"))
				.willReturn(Optional.of(member));

			Member result = memberService.getByUsername("test");

			assertThat(result.getUsername()).isEqualTo("test");
		}

		@Test
		@DisplayName("실패: 존재하지 않는 username 조회")
		void getByUsernameFail() {
			given(memberRepository.findByUsername("none"))
				.willReturn(Optional.empty());

			assertThatThrownBy(() -> memberService.getByUsername("none"))
				.isInstanceOf(CustomException.class)
				.hasMessage(ErrorCode.USER_NOT_FOUND.getMessage());
		}

		@Test
		@DisplayName("성공: 회원 정보 수정")
		void updateMemberSuccess() {
			UpdateMemberRequestDTO request =
				new UpdateMemberRequestDTO("new_name", "new_pw");

			given(memberRepository.findByUsername("test"))
				.willReturn(Optional.of(member));

			given(passwordEncoder.encode("new_pw"))
				.willReturn("new_hash");

			given(memberRepository.save(any(Member.class)))
				.willAnswer(invocation -> invocation.getArgument(0));

			Member result = memberService.updateMember("test", request);

			assertThat(result.getDisplayName()).isEqualTo("new_name");
			assertThat(result.getHashedPassword()).isEqualTo("new_hash");
		}

		@Test
		@DisplayName("실패: 수정 시 회원 없음")
		void updateMemberFail() {
			given(memberRepository.findByUsername("none"))
				.willReturn(Optional.empty());

			assertThatThrownBy(() ->
				memberService.updateMember("none",
					new UpdateMemberRequestDTO("a","b")))
				.isInstanceOf(CustomException.class)
				.hasMessage(ErrorCode.USER_NOT_FOUND.getMessage());
		}

		@Test
		@DisplayName("성공: 회원 삭제")
		void deleteMemberSuccess() {
			given(memberRepository.findByUsername("test"))
				.willReturn(Optional.of(member));

			memberService.deleteMember("test");

			then(memberRepository).should().delete(member);
		}

		@Test
		@DisplayName("실패: 회원 삭제 - 없음")
		void deleteMemberFail() {
			given(memberRepository.findByUsername("none"))
				.willReturn(Optional.empty());

			assertThatThrownBy(() -> memberService.deleteMember("none"))
				.isInstanceOf(CustomException.class)
				.hasMessage(ErrorCode.USER_NOT_FOUND.getMessage());
		}
	}

}
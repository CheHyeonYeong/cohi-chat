package com.coDevs.cohiChat.account.service;

import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.coDevs.cohiChat.account.dto.LoginRequest;
import com.coDevs.cohiChat.account.dto.LoginResponse;
import com.coDevs.cohiChat.account.dto.SignupRequest;
import com.coDevs.cohiChat.account.dto.UpdateMemberRequest;
import com.coDevs.cohiChat.account.entity.Member;
import com.coDevs.cohiChat.account.repository.MemberRepository;
import com.coDevs.cohiChat.global.security.jwt.JwtTokenProvider;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

	@Mock
	private MemberRepository accountRepository;

	@Mock
	private PasswordEncoder passwordEncoder;

	@Mock
	private JwtTokenProvider jwtTokenProvider;

	@InjectMocks
	private AccountService accountService;
	//공통 세팅
	@BeforeEach
	void setUp() {
		//save 시 전달된 Account 그대로 반환
		when(accountRepository.save(any(Member.class)))
			.thenAnswer(invocation -> invocation.getArgument(0));
	}


	//회원가입
	@Test
	void 회원가입_성공_모든_입력_항목이_유효하면() {

		// arrange
		SignupRequest request = new SignupRequest(
			"testuser",
			"test@test.com",
			"password123",
			"password123",
			"test_nickname",
			true
		);

		when(accountRepository.existsByUsername("testuser")).thenReturn(false);
		when(accountRepository.existsByEmail("test@test.com")).thenReturn(false);
		when(passwordEncoder.encode("password123")).thenReturn("ENCODED");
		when(accountRepository.save(any(Member.class)))
			.thenAnswer(invocation -> invocation.getArgument(0));

		// act
		Member result = accountService.signup(request);

		// assert
		assertThat(result)
			.extracting(
				Member::getUsername,
				Member::getEmail,
				Member::isHost
			)
			.containsExactly(
				"testuser",
				"test@test.com",
				false
			);
	}


	@Test
	void 회원가입_실패_username_중복() {
		//arrange
		SignupRequest request = new SignupRequest(
			"testuser",
			"test@test.com",
			"password123",
			"password123",
			"test_nickname",
			true
		);
		when(accountRepository.existsByUsername("testuser"))
			.thenReturn(true);
		//act
		//실패해서 Member 객체가 생성되지 않으므로 act 단계 존재 X
		//assert
		assertThatThrownBy(() -> accountService.signup(request))
			.isInstanceOf(IllegalStateException.class)
			.hasMessageContaining("username");
	}

	@Test
	void 회원가입_실패_email_중복() {
		//arrange
		SignupRequest request = new SignupRequest(
			"testuser",
			"test@test.com",
			"password123",
			"password123",
			"test_nickname",
			true
		);
		when(accountRepository.existsByEmail("test@test.com"))
			.thenReturn(true);
		//act
		//실패해서 Member 객체가 생성되지 않으므로 act 단계 존재 X
		//assert
		assertThatThrownBy(() -> accountService.signup(request))
			.isInstanceOf(IllegalStateException.class)
			.hasMessageContaining("email");
	}

	@Test
	void 회원가입시_표시명_미입력시_자동_생성됨(){
		//arrange
		SignupRequest request = new SignupRequest(
			"testuser",
			null,
			"password123",
			"password123",
			"test_nickname",
			true
		);
		//act
		Member result = accountService.signup(request);
		//assert
		assertThat(result.getDisplayName())
			.isNotNull()
			.hasSize(8);

	}

	@Test
	void 회원가입시_비밀번호는_해시되어_저장(){
		//arrange
		SignupRequest request = new SignupRequest(
			"testuser",
			null,
			"password123",
			"password123",
			"test_nickname",
			true
		);
		//act
		Member result = accountService.signup(request);
		//assert
		assertThat(result.getHashedPassword())
			.isNotEqualTo("password123");

	}

	//로그인 관련
	@Test
	void 로그인_성공_username과_비밀번호_동일() {
		//Service 레벨에서 토큰은 기대하지 않는다
		//사용자가 존재하고, 비밀번호가 맞고, 로그인이 성공했다는 결과 반환이 이뤄지는지 체크

		//arrange
		LoginRequest request = new LoginRequest(
			"testuser",
			"password123"
		);

		Member member = Member.builder()
			.username("testuser")
			.hashedPassword("ENCODED")
			.host(false)
			.build();

		when(accountRepository.findByUsername("testuser"))
			.thenReturn(Optional.of(member));

		when(passwordEncoder.matches("password123", "ENCODED"))
			.thenReturn(true);

		when(jwtTokenProvider.createToken(any()))
			.thenReturn("fake-jwt-token");

		//act
		LoginResponse result = accountService.authenticate(request);
		//assert
		assertThat(result)
			.isNotNull();

		//토큰 검증이 아니라 토큰 존재 여부만 확인
		assertThat(result.accessToken())
			.isNotBlank();
	}

	@Test
	void 로그인_실패_username이_존재하지_않으면() {
		//arrange
		LoginRequest request = new LoginRequest(
			"testuser",
			"password123"
		);

		when(accountRepository.findByUsername("testuser"))
			.thenReturn(Optional.empty());
		//act
		//assert
		assertThatThrownBy(() -> accountService.authenticate(request))
			.isInstanceOf(IllegalStateException.class)
			.hasMessageContaining("username");

	}

	@Test
	void 로그인_실패_비밀번호가_일치하지_않으면() {
		//arrange
		LoginRequest request = new LoginRequest(
			"testuser",
			"password123"
		);

		Member member = Member.builder()
				.username("testuser")
				.hashedPassword("ENCODED")
				.build();
		when(accountRepository.findByUsername("testuser"))
			.thenReturn(Optional.empty());
		when(passwordEncoder.matches("password123", "ENCODED"))
			.thenReturn(false);

		//act
		//assert
		assertThatThrownBy(() -> accountService.authenticate(request))
			.isInstanceOf(IllegalStateException.class)
			.hasMessageContaining("password");

	}

	//회원 정보 조회
	@Test
	void 회원_정보_조회_성공_username으로_사용자_조회_가능() {
		//arrange
		Member member = Member.builder()
			.id(1L)
			.username("testuser")
			.email("test@test.com")
			.host(false)
			.createdAt(LocalDateTime.now())
			.updatedAt(LocalDateTime.now())
			.build();

		when(accountRepository.findByUsername("testuser"))
			.thenReturn(Optional.of(member));
		//act
		Member result = accountService.getMemberByUsername("testuser");
		//assert
		assertThat(result)
			.extracting(
				Member::getId,
				Member::getUsername,
				Member::getEmail,
				Member::isHost
			)
			.containsExactly(
				1L,
				"testuser",
				"test@test.com",
				false
			);

	}

	@Test
	void 회원_정보_조회_실패_username이_존재하지_않으면() {
		//arrange
		when(accountRepository.findByUsername("testuser"))
			.thenReturn(Optional.empty());
		//act
		//assert
		assertThatThrownBy(() -> accountService.getMemberByUsername("testuser"))
			.isInstanceOf(IllegalStateException.class)
			.hasMessageContaining("username");

	}

	//회원 정보 수정
	@Test
	void 표시명_수정_성공() {
		// arrange
		Member member = Member.builder()
			.id(1L)
			.username("testuser")
			.email("test@test.com")
			.displayName("old_name")
			.host(false)
			.createdAt(LocalDateTime.now().minusDays(1))
			.updatedAt(LocalDateTime.now().minusDays(1))
			.build();

		UpdateMemberRequest request = new UpdateMemberRequest(
			"new_name",
			null
		);

		when(accountRepository.findByUsername("testuser"))
			.thenReturn(Optional.of(member));

		// act
		Member result = accountService.updateMember("testuser", request);

		// assert
		assertThat(result.getDisplayName()).isEqualTo("new_name");

	}

	@Test
	void 비밀번호_변경시_해시되어_저장() {
		// arrange
		Member member = Member.builder()
			.id(1L)
			.username("testuser")
			.hashedPassword("OLD_HASH")
			.build();

		UpdateMemberRequest request = new UpdateMemberRequest(
			null,
			"newPassword123"
		);

		when(accountRepository.findByUsername("testuser"))
			.thenReturn(Optional.of(member));

		when(passwordEncoder.encode("newPassword123"))
			.thenReturn("NEW_HASH");

		// act
		Member result = accountService.updateMember("testuser", request);

		// assert
		assertThat(result.getHashedPassword()).isEqualTo("NEW_HASH");
	}

	@Test
	void 비밀번호_변경시_update_at_갱신되어_저장() {
		// arrange
		LocalDateTime before = LocalDateTime.now().minusDays(1);

		Member member = Member.builder()
			.id(1L)
			.username("testuser")
			.hashedPassword("OLD_HASH")
			.updatedAt(before)
			.build();

		UpdateMemberRequest request = new UpdateMemberRequest(
			null,
			"newPassword123"
		);

		when(accountRepository.findByUsername("testuser"))
			.thenReturn(Optional.of(member));

		when(passwordEncoder.encode(any()))
			.thenReturn("NEW_HASH");

		// act
		Member result = accountService.updateMember("testuser", request);

		// assert
		assertThat(result.getUpdatedAt()).isAfter(before);
	}

	@Test
	void 계정_삭제시_사용자_삭제() {
		// arrange
		Member member = Member.builder()
			.id(1L)
			.username("testuser")
			.build();

		when(accountRepository.findByUsername("testuser"))
			.thenReturn(Optional.of(member));

		// act
		accountService.deleteMember("testuser");

		// assert
		verify(accountRepository).delete(member);

	}

}
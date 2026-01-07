package com.coDevs.cohiChat.member;

import java.security.SecureRandom;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.request.CreateMemberRequestDTO;
import com.coDevs.cohiChat.member.response.CreateMemberResponseDTO;
import com.coDevs.cohiChat.member.response.MemberResponseDTO;
import com.coDevs.cohiChat.member.request.UpdateMemberRequestDTO;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.mapper.MemberMapper;

import lombok.RequiredArgsConstructor;

/**
 * 회원 관리 비즈니스 로직을 처리하는 서비스.
 *
 * - 회원가입, 정보 수정, 계정 삭제 등 사용자 신원 관리 전반을 담당한다.
 * - 패스워드 암호화 및 식별값 중복 검증을 수행한다.
 */
@Service
@RequiredArgsConstructor
public class MemberService {

	private final MemberRepository memberRepository;
	private final PasswordEncoder passwordEncoder;
	private final MemberMapper memberMapper;

	/**
	 * 신규 회원을 등록한다.
	 *
	 * @param request 가입에 필요한 사용자 입력 정보
	 * @return 가입 완료된 회원 정보
	 * @throws CustomException 비밀번호 불일치, 아이디 중복, 또는 이메일 중복 시 발생
	 */
	@Transactional
	public CreateMemberResponseDTO signUp(CreateMemberRequestDTO request) {

		if (!request.password().equals(request.passwordAgain())) {
			throw new CustomException(ErrorCode.PASSWORD_MISMATCH);
		}

		if (memberRepository.existsByUsername(request.username())) {
			throw new CustomException(ErrorCode.DUPLICATED_USERNAME);
		}

		if (memberRepository.existsByEmail(request.email())) {
			throw new CustomException(ErrorCode.DUPLICATED_EMAIL);
		}

		String encodedPassword = passwordEncoder.encode(request.password());

		String displayName = request.displayName();
		if (displayName == null|| displayName.isBlank()) {
			displayName = generateRandomDisplayName();
		}
		Member member = Member.create(
			request.username(),
			displayName,
			request.email(),
			encodedPassword,
			request.isHost()
		);

		Member savedMember = memberRepository.save(member);

		return memberMapper.toSignupResponse(savedMember);
	}

	private static final String[] FIRST = {
		"달콤한",
		"고소한",
		"포근한",
		"따뜻한"
	};

	private static final String[] SECOND = {
		"커피",
		"라떼",
		"카페",
		"모카"
	};

	private static final String[] THIRD = {
		"직장인",
		"개발자",
		"취준생",
		"방문자"
	};

	private static final SecureRandom RANDOM = new SecureRandom();

	private String generateRandomDisplayName() {
		String nickname =
			FIRST[RANDOM.nextInt(FIRST.length)] +
				SECOND[RANDOM.nextInt(SECOND.length)] +
				THIRD[RANDOM.nextInt(THIRD.length)];


		if (nickname.length() != 8) {
			throw new IllegalStateException(
				"닉네임 길이가 8글자가 아닙니다: " + nickname
			);
		}

		return nickname;
	}

	/**
	 * 사용자 아이디로 회원 상세 정보를 조회한다.
	 *
	 * @param username 조회할 사용자 아이디
	 * @return 회원 응답 정보
	 * @throws CustomException 사용자를 찾을 수 없을 경우 발생
	 */
	public MemberResponseDTO getByUsername(String username) {

		Member member = memberRepository.findByUsername(username)
			.orElseThrow(() ->
				new CustomException(ErrorCode.USER_NOT_FOUND)
			);

		return memberMapper.toResponse(member);
	}

	/**
	 * 회원 프로필 정보를 수정한다.
	 *
	 * @param username 대상 사용자 아이디
	 * @param request 변경할 필드 정보 (Nullable)
	 * @return 수정된 회원 정보
	 */
	@Transactional
	public MemberResponseDTO updateMember(String username, UpdateMemberRequestDTO request) {

		Member member = memberRepository.findByUsername(username)
			.orElseThrow(() ->
				new CustomException(ErrorCode.USER_NOT_FOUND)
			);

		if (request.displayName() != null) {
			member.updateDisplayName(request.displayName());
		}

		if (request.password() != null) {
			String encodedPassword = passwordEncoder.encode(request.password());
			member.updatePassword(encodedPassword);
		}

		// dirty checking 후 DTO 반환
		return memberMapper.toResponse(member);
	}

	/**
	 * 회원 계정을 삭제(탈퇴) 처리한다.
	 *
	 * @param username 탈퇴할 사용자 아이디
	 */
	@Transactional
	public void deleteMe(String username) {
		Member member = getMemberEntityByUsername(username);
		memberRepository.delete(member);
	}

	private Member getMemberEntityByUsername(String username) {
		return memberRepository.findByUsername(username)
			.orElseThrow(() ->
				new CustomException(ErrorCode.USER_NOT_FOUND)
			);
	}
}

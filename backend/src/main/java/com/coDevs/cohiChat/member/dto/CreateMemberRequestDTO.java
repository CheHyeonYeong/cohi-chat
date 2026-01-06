package com.coDevs.cohiChat.member.dto;

/**
 * 신규 회원 가입 요청 데이터를 담는 DTO.
 *
 * @param username 사용자 식별 아이디 (50자 이내)
 * @param displayName 서비스 내에서 표시될 이름 (미입력 시 랜덤 생성)
 * @param email 사용자 연락처 및 인증용 이메일
 * @param password 가입용 평문 비밀번호
 * @param passwordAgain 비밀번호 일치 여부 확인을 위한 재입력 값
 * @param isHost 호스트 권한 신청 여부
 */
public record CreateMemberRequestDTO(
	String username,
	String displayName,
	String email,
	String password, //평문 pw
	String passwordAgain, //검증용
	Boolean isHost //역할 체크
){}

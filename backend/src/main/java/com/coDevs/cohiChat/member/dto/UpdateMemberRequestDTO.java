package com.coDevs.cohiChat.member.dto;

/**
 * 회원 정보 수정 요청 데이터.
 *
 * @param displayName 변경할 서비스 내 표시 이름 (수정하지 않을 경우 null)
 * @param password 변경할 새로운 평문 비밀번호 (수정하지 않을 경우 null)
 */
public record UpdateMemberRequestDTO(
	String displayName,
	String password
)
{}

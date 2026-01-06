package com.coDevs.cohiChat.member.dto;

import java.time.LocalDateTime;

/**
 * 회원 상세 정보 조회 응답 데이터.
 *
 * @param id 회원의 고유 식별 번호
 * @param username 사용자 식별 아이디
 * @param displayName 서비스 내에서 표시되는 이름
 * @param email 연락 및 인증용 이메일
 * @param isHost 호스트 권한 보유 여부
 * @param createdAt 계정 생성 일시
 * @param updatedAt 계정 정보 수정 일시
 */
public record MemberResponseDTO(
	Long id,
	String username,
	String displayName,
	String email,
	Boolean isHost,
	LocalDateTime createdAt,
	LocalDateTime updatedAt
) {}

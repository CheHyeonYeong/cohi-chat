package com.coDevs.cohiChat.member.dto;

import java.time.LocalDateTime;

/**
 * 회원가입 완료 후 반환되는 응답 데이터.
 *
 * @param id 회원의 고유 식별 번호
 * @param username 가입된 사용자 아이디
 * @param displayName 가입된 서비스 내 표시 이름
 * @param email 가입된 연락용 이메일
 * @param isHost 호스트 권한 보유 여부
 * @param createdAt 계정 생성 일시
 * @param updatedAt 계정 정보 수정 일시
 */
public record CreateMemberResponseDTO(
	Long id,
	String username,
	String displayName,
	String email,
	Boolean isHost,
	LocalDateTime createdAt,
	LocalDateTime updatedAt
) {
}

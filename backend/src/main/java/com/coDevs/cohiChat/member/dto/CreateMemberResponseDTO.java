package com.coDevs.cohiChat.member.dto;

import java.time.LocalDateTime;

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

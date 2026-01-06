package com.coDevs.cohiChat.member.dto;

import java.time.LocalDateTime;

public record SignupResponseDTO(
	Long id,
	String username,
	String displayName,
	String email,
	Boolean isHost,
	LocalDateTime createdAt,
	LocalDateTime updatedAt
) {
}

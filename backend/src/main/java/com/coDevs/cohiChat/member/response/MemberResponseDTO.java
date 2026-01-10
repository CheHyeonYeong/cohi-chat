package com.coDevs.cohiChat.member.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record MemberResponseDTO(
	UUID id,
	String username,
	String displayName,
	String email,
	Boolean isHost,
	LocalDateTime createdAt,
	LocalDateTime updatedAt
) {}

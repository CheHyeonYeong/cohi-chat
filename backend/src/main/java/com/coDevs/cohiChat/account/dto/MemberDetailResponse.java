package com.coDevs.cohiChat.account.dto;

import java.time.LocalDateTime;

public record MemberDetailResponse(
	Integer id,
	String username,
	String displayName,
	String email,
	Boolean isHost,
	LocalDateTime createdAt,
	LocalDateTime updatedAt
) {}

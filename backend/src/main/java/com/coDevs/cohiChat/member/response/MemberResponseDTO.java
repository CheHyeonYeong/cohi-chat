package com.coDevs.cohiChat.member.response;

import java.time.LocalDateTime;
import java.util.UUID;

import com.coDevs.cohiChat.member.entity.Role;

public record MemberResponseDTO(
	UUID id,
	String username,
	String displayName,
	String email,
	Role role,
	LocalDateTime createdAt,
	LocalDateTime updatedAt
) {}

package com.coDevs.cohiChat.member.response;

public record SafeLoginResponseDTO(
	String username,
	String displayName,
	long expiredInMinutes
) {}

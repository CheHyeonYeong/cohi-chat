package com.coDevs.cohiChat.auth.response;

public record LoginResponseDTO(
	String accessToken,
	String tokenType,
	String refreshToken,
	String username,
	String displayName
){}

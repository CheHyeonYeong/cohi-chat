package com.coDevs.cohiChat.auth.dto;

public record LoginResponse (
	String accessToken,
	String tokenType
){}

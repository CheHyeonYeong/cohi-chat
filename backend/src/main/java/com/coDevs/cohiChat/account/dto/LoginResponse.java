package com.coDevs.cohiChat.account.dto;

public record LoginResponse (
	String accessToken,
	String tokenType
){}

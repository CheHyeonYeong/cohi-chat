package com.coDevs.cohiChat.auth.response;

public record LoginResponse (
	String accessToken,
	String tokenType
){}

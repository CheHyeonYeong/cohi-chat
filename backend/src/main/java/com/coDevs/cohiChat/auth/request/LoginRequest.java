package com.coDevs.cohiChat.auth.request;

public record LoginRequest (
	String username,
	String password
){}

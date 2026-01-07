package com.coDevs.cohiChat.member.request;

public record CreateMemberRequestDTO(
	String username,
	String displayName,
	String email,
	String password, //평문 pw
	Boolean isHost //역할 체크
){}

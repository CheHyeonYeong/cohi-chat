package com.coDevs.cohiChat.account.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public record SignupRequest (
	String username,
	String displayName,
	String email,
	String password, //평문 pw
	String passwordAgain, //검증용
	Boolean isHost //역할 체크
){}

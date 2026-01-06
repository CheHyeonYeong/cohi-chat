package com.coDevs.cohiChat.member.dto;


public record CreateMemberRequestDTO(
	String username,
	String displayName,
	String email,
	String password, //평문 pw
	String passwordAgain, //검증용
	Boolean isHost //역할 체크
){
	public boolean isPasswordMatching() {
		return password != null && password.equals(passwordAgain);
	}
}

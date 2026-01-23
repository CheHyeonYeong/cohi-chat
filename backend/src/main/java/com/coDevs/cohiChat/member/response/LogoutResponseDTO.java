package com.coDevs.cohiChat.member.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LogoutResponseDTO {
	private String message;

	public static LogoutResponseDTO success() {

		return new LogoutResponseDTO("로그아웃 되었습니다.");

	}
}

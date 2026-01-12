package com.coDevs.cohiChat.global.response;

import lombok.Getter;

@Getter
public class ErrorResponseDTO {

	private final String code;
	private final String message;

	public ErrorResponseDTO(String code, String message) {
		this.code = code;
		this.message = message;
	}
}

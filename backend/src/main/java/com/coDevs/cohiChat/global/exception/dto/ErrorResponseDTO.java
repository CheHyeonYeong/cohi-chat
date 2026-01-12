package com.coDevs.cohiChat.global.exception.dto;

import com.coDevs.cohiChat.global.exception.ErrorCode;

import lombok.Getter;

@Getter
public class ErrorResponseDTO {
	private final String code;
	private final String message;

	public ErrorResponseDTO(ErrorCode errorCode) {
		this.code = errorCode.name();
		this.message = errorCode.getMessage();
	}
}

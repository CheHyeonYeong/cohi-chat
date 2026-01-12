package com.coDevs.cohiChat.global.response;

import org.springframework.web.ErrorResponse;

import lombok.Getter;

@Getter
public class ApiResponseDTO<T> {

	private final boolean success;
	private final T data;
	private final ErrorResponseDTO error;

	private ApiResponseDTO(boolean success, T data, ErrorResponseDTO error) {
		this.success = success;
		this.data = data;
		this.error = error;
	}

	public static <T> ApiResponseDTO<T> success(T data) {
		return new ApiResponseDTO<>(true, data, null);
	}

	public static ApiResponseDTO<Void> fail(ErrorResponseDTO error) {
		return new ApiResponseDTO<>(false, null, error);
	}
}



package com.coDevs.cohiChat.global.response;

public record ApiResponse<T>(
	boolean success,
	T data,
	ErrorResponse error
) {
	public static <T> ApiResponse<T> success(T data) {
		return new ApiResponse<>(true, data, null);
	}

	public static ApiResponse<Void> fail(ErrorResponse error) {
		return new ApiResponse<>(false, null, error);
	}
}


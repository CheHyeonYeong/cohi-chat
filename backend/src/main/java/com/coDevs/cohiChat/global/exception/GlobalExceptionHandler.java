package com.coDevs.cohiChat.global.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.coDevs.cohiChat.global.response.ApiResponse;
import com.coDevs.cohiChat.global.response.ErrorResponse;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(CustomException.class)
	public ResponseEntity<ApiResponse<Void>> handleCustomException(CustomException e) {
		ErrorCode code = e.getErrorCode();

		return ResponseEntity
			.status(code.getStatus())
			.body(ApiResponse.fail(
				new ErrorResponse(code.name(), code.getMessage())
			));
	}

}

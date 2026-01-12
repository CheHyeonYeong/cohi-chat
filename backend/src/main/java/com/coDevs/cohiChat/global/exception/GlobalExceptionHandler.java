package com.coDevs.cohiChat.global.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.coDevs.cohiChat.global.response.ApiResponseDTO;
import com.coDevs.cohiChat.global.response.ErrorResponseDTO;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(CustomException.class)
	public ResponseEntity<ApiResponseDTO<Void>> handleCustomException(CustomException e) {
		ErrorCode code = e.getErrorCode();

		return ResponseEntity
			.status(code.getStatus())
			.body(ApiResponseDTO.fail(
				new ErrorResponseDTO(code.name(), code.getMessage())
			));
	}
}

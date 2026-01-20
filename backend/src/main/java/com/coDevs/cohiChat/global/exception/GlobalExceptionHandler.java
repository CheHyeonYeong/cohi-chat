package com.coDevs.cohiChat.global.exception;

import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.coDevs.cohiChat.global.response.ApiResponseDTO;

import com.coDevs.cohiChat.global.response.ErrorResponseDTO;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(CustomException.class)
	public ResponseEntity<ApiResponseDTO<Void>> handleCustomException(CustomException e) {
		return createErrorResponse(e.getErrorCode());
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ApiResponseDTO<Void>> handleAccessDeniedException(AccessDeniedException e) {
		return createErrorResponse(ErrorCode.ACCESS_DENIED);
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiResponseDTO<Void>> handleValidationException(MethodArgumentNotValidException e) {
		String errorMessage = e.getBindingResult()
			.getFieldErrors()
			.stream()
			.map(error -> error.getDefaultMessage())
			.collect(Collectors.joining(", "));

		return createErrorResponse(ErrorCode.INVALID_INPUT, errorMessage);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiResponseDTO<Void>> handleAllException(Exception e) {
		return createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
	}

	private ResponseEntity<ApiResponseDTO<Void>> createErrorResponse(ErrorCode code) {
		return createErrorResponse(code, code.getMessage());
	}

	private ResponseEntity<ApiResponseDTO<Void>> createErrorResponse(ErrorCode code, String message) {
		return ResponseEntity.status(code.getStatus())
			.body(ApiResponseDTO.fail(new ErrorResponseDTO(code.name(), message)));
	}
}

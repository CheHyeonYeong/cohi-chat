package com.coDevs.cohiChat.global.exception;

import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.validation.ConstraintViolationException;

import com.coDevs.cohiChat.global.response.ApiResponseDTO;

import com.coDevs.cohiChat.global.response.ErrorResponseDTO;

@RestControllerAdvice
public class GlobalExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

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

	@ExceptionHandler(ConstraintViolationException.class)
	public ResponseEntity<ApiResponseDTO<Void>> handleConstraintViolationException(ConstraintViolationException e) {
		String errorMessage = e.getConstraintViolations()
			.stream()
			.map(violation -> violation.getMessage())
			.collect(Collectors.joining(", "));

		return createErrorResponse(ErrorCode.INVALID_INPUT, errorMessage);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiResponseDTO<Void>> handleAllException(Exception e) {
		log.error("Unhandled exception occurred: {}", e.getMessage(), e);
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

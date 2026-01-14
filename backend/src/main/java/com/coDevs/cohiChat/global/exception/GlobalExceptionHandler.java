package com.coDevs.cohiChat.global.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.BadSqlGrammarException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.coDevs.cohiChat.global.response.ApiResponseDTO;
import com.coDevs.cohiChat.global.response.ErrorResponseDTO;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(CustomException.class)
	public ResponseEntity<ApiResponseDTO<Void>> handleCustomException(CustomException e) {
		ErrorCode code = e.getErrorCode();
		return ResponseEntity.status(code.getStatus())
			.body(ApiResponseDTO.fail(new ErrorResponseDTO(code.name(), code.getMessage())));
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ApiResponseDTO<Void>> handleAccessDeniedException(AccessDeniedException e) {
		ErrorCode code = ErrorCode.ACCESS_DENIED;
		return ResponseEntity.status(code.getStatus())
			.body(ApiResponseDTO.fail(new ErrorResponseDTO(code.name(), code.getMessage())));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiResponseDTO<Void>> handleValidationException(MethodArgumentNotValidException e) {
		String message = e.getBindingResult().getAllErrors().get(0).getDefaultMessage();
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
			.body(ApiResponseDTO.fail(new ErrorResponseDTO("INVALID_INPUT", message)));
	}

	@ExceptionHandler(CannotCreateTransactionException.class)
	public ResponseEntity<ApiResponseDTO<Void>> handleDbConnectionError(CannotCreateTransactionException e) {
		ErrorCode code = ErrorCode.DATABASE_CONNECTION_ERROR;
		return ResponseEntity.status(code.getStatus())
			.body(ApiResponseDTO.fail(new ErrorResponseDTO(code.name(), code.getMessage())));
	}


	@ExceptionHandler(BadSqlGrammarException.class)
	public ResponseEntity<ApiResponseDTO<Void>> handleSqlError(BadSqlGrammarException e) {
		ErrorCode code = ErrorCode.DATABASE_SCHEMA_ERROR;
		return ResponseEntity.status(code.getStatus())
			.body(ApiResponseDTO.fail(new ErrorResponseDTO(code.name(), code.getMessage())));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiResponseDTO<Void>> handleAllException(Exception e) {
		ErrorCode code = ErrorCode.INTERNAL_SERVER_ERROR;
		return ResponseEntity.status(code.getStatus())
			.body(ApiResponseDTO.fail(new ErrorResponseDTO(code.name(), code.getMessage())));
	}
}

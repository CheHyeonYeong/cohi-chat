package com.coDevs.cohiChat.global.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.global.exception.dto.ErrorResponseDTO;

@RestController
public class GlobalExceptionHandler {
	@ExceptionHandler(CustomException.class)
	public ResponseEntity<ErrorResponseDTO> handleCustomException(CustomException e) {
		ErrorCode code = e.getErrorCode();
		return ResponseEntity
			.status(code.getStatus())
			.body(new ErrorResponseDTO(code));
	}

}

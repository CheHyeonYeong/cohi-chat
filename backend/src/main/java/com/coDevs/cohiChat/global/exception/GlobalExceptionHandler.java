package com.coDevs.cohiChat.global.exception;

import java.util.stream.Collectors;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.coDevs.cohiChat.global.observability.StructuredLogMessage;
import com.coDevs.cohiChat.global.response.ApiResponseDTO;
import com.coDevs.cohiChat.global.response.ErrorResponseDTO;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ApiResponseDTO<Void>> handleCustomException(
        CustomException e,
        HttpServletRequest request
    ) {
        logHandledFailure(request, e.getErrorCode().getStatus(), e.getErrorCode().name(), null);
        return createErrorResponse(e.getErrorCode());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponseDTO<Void>> handleAccessDeniedException(
        AccessDeniedException e,
        HttpServletRequest request
    ) {
        logHandledFailure(request, HttpStatus.FORBIDDEN, ErrorCode.ACCESS_DENIED.name(), null);
        return createErrorResponse(ErrorCode.ACCESS_DENIED);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponseDTO<Void>> handleValidationException(
        MethodArgumentNotValidException e,
        HttpServletRequest request
    ) {
        String errorMessage = e.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(error -> error.getDefaultMessage())
            .collect(Collectors.joining(", "));

        logHandledFailure(request, HttpStatus.BAD_REQUEST, ErrorCode.INVALID_INPUT.name(), null);
        return createErrorResponse(ErrorCode.INVALID_INPUT, errorMessage);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponseDTO<Void>> handleConstraintViolationException(
        ConstraintViolationException e,
        HttpServletRequest request
    ) {
        String errorMessage = e.getConstraintViolations()
            .stream()
            .map(violation -> violation.getMessage())
            .collect(Collectors.joining(", "));

        logHandledFailure(request, HttpStatus.BAD_REQUEST, ErrorCode.INVALID_INPUT.name(), null);
        return createErrorResponse(ErrorCode.INVALID_INPUT, errorMessage);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponseDTO<Void>> handleHttpMessageNotReadableException(
        HttpMessageNotReadableException e,
        HttpServletRequest request
    ) {
        logHandledFailure(request, HttpStatus.BAD_REQUEST, ErrorCode.INVALID_INPUT.name(), null);
        return createErrorResponse(ErrorCode.INVALID_INPUT);
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ApiResponseDTO<Void>> handleDataAccessException(
        DataAccessException e,
        HttpServletRequest request
    ) {
        logHandledFailure(request, HttpStatus.INTERNAL_SERVER_ERROR, "DATA_ACCESS_ERROR", e);
        return createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponseDTO<Void>> handleAllException(Exception e, HttpServletRequest request) {
        logHandledFailure(request, HttpStatus.INTERNAL_SERVER_ERROR, "UNHANDLED_EXCEPTION", e);
        return createErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    }

    private void logHandledFailure(HttpServletRequest request, HttpStatus status, String code, Exception e) {
        StructuredLogMessage messageBuilder = StructuredLogMessage.of("context", "FAIL")
            .add("context", "request")
            .add("method", request.getMethod())
            .add("path", request.getRequestURI())
            .add("status", status.value())
            .add("code", code);
        if (e != null) {
            messageBuilder.add("cause", e.getClass().getSimpleName());
        }
        String message = messageBuilder.build();

        if (status.is5xxServerError()) {
            log.error(message, e);
            return;
        }
        log.warn(message);
    }

    private ResponseEntity<ApiResponseDTO<Void>> createErrorResponse(ErrorCode code) {
        return createErrorResponse(code, code.getMessage());
    }

    private ResponseEntity<ApiResponseDTO<Void>> createErrorResponse(ErrorCode code, String message) {
        return ResponseEntity.status(code.getStatus())
            .body(ApiResponseDTO.fail(new ErrorResponseDTO(code.name(), message)));
    }
}

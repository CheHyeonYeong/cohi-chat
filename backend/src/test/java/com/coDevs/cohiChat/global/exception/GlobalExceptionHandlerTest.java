package com.coDevs.cohiChat.global.exception;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import com.coDevs.cohiChat.global.response.ApiResponseDTO;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;
    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
        request = new MockHttpServletRequest("GET", "/api/test");
    }

    @Test
    @DisplayName("DataAccessException 발생 시 generic 메시지만 반환한다")
    void dataAccessException_returnsGenericMessage() {
        DataAccessException exception = new DataAccessException(
            "ERROR: column m1_0.is_banned does not exist Position: 137"
        ) {};

        ResponseEntity<ApiResponseDTO<Void>> response = handler.handleDataAccessException(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getError().getMessage())
            .isEqualTo("서버 내부 오류가 발생했습니다.");
        assertThat(response.getBody().getError().getMessage())
            .doesNotContain("column", "is_banned", "ERROR");
    }

    @Test
    @DisplayName("일반 Exception 발생 시 generic 메시지만 반환한다")
    void generalException_returnsGenericMessage() {
        Exception exception = new RuntimeException("NullPointerException at com.coDevs.cohiChat.service.MemberService.findById");

        ResponseEntity<ApiResponseDTO<Void>> response = handler.handleAllException(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getError().getMessage())
            .isEqualTo("서버 내부 오류가 발생했습니다.");
        assertThat(response.getBody().getError().getMessage())
            .doesNotContain("NullPointerException", "MemberService", "findById");
    }

    @Test
    @DisplayName("5xx 응답 메시지에 SQL/DB 관련 키워드가 포함되지 않는다")
    void serverError_doesNotLeakSqlKeywords() {
        DataAccessException sqlException = new DataAccessException(
            "could not execute statement; SQL [insert into member]; constraint [uk_member_email]"
        ) {};

        ResponseEntity<ApiResponseDTO<Void>> response = handler.handleDataAccessException(sqlException, request);
        String message = response.getBody().getError().getMessage();

        assertThat(message).doesNotContainIgnoringCase("SQL");
        assertThat(message).doesNotContainIgnoringCase("constraint");
        assertThat(message).doesNotContainIgnoringCase("insert");
        assertThat(message).doesNotContainIgnoringCase("member");
    }

    @Test
    @DisplayName("CustomException은 ErrorCode 메시지를 반환한다")
    void customException_returnsErrorCodeMessage() {
        CustomException exception = new CustomException(ErrorCode.DUPLICATED_USERNAME);

        ResponseEntity<ApiResponseDTO<Void>> response = handler.handleCustomException(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().getError().getMessage())
            .isEqualTo("중복된 계정 ID입니다.");
    }
}

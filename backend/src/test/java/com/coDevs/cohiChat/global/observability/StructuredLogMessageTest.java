package com.coDevs.cohiChat.global.observability;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class StructuredLogMessageTest {

    @Test
    @DisplayName("구조화 로그는 action status prefix와 key-value details를 유지한다")
    void buildStructuredMessage() {
        String message = StructuredLogMessage.of("http", "FAIL")
            .add("context", "request")
            .add("method", "POST")
            .add("path", "/api/members/v1/login")
            .add("status", 404)
            .build();

        assertThat(message)
            .isEqualTo("[http] [FAIL] context=request method=POST path=/api/members/v1/login status=404");
    }

    @Test
    @DisplayName("공백이 있는 값은 따옴표로 감싼다")
    void quoteValueWithWhitespace() {
        String message = StructuredLogMessage.of("slowquery", "SLOW")
            .add("query", "select * from member where email = ?")
            .build();

        assertThat(message)
            .isEqualTo("[slowquery] [SLOW] query=\"select * from member where email = ?\"");
    }
}

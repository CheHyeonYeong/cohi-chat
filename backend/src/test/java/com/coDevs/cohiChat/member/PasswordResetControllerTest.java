package com.coDevs.cohiChat.member;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.global.exception.GlobalExceptionHandler;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(PasswordResetController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class PasswordResetControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private PasswordResetService passwordResetService;

    @Nested
    @DisplayName("POST /members/v1/password-reset/request")
    class RequestPasswordReset {

        @Test
        @DisplayName("성공: 비밀번호 재설정 요청")
        void requestPasswordReset_success() throws Exception {
            // given
            String email = "user@example.com";
            doNothing().when(passwordResetService).requestPasswordReset(email);

            // when & then
            mockMvc.perform(post("/members/v1/password-reset/request")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\": \"" + email + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("비밀번호 재설정 이메일이 발송되었습니다."));

            verify(passwordResetService).requestPasswordReset(email);
        }

        @Test
        @DisplayName("실패: 잘못된 이메일 형식")
        void requestPasswordReset_invalidEmail() throws Exception {
            mockMvc.perform(post("/members/v1/password-reset/request")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\": \"invalid-email\"}"))
                .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("실패: 이메일 누락")
        void requestPasswordReset_missingEmail() throws Exception {
            mockMvc.perform(post("/members/v1/password-reset/request")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /members/v1/password-reset/confirm")
    class ConfirmPasswordReset {

        @Test
        @DisplayName("성공: 비밀번호 재설정 완료")
        void confirmPasswordReset_success() throws Exception {
            // given
            String token = "valid-token";
            String newPassword = "newPassword123!";
            doNothing().when(passwordResetService).resetPassword(token, newPassword);

            // when & then
            mockMvc.perform(post("/members/v1/password-reset/confirm")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"token\": \"" + token + "\", \"newPassword\": \"" + newPassword + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("비밀번호가 성공적으로 변경되었습니다."));

            verify(passwordResetService).resetPassword(token, newPassword);
        }

        @Test
        @DisplayName("실패: 유효하지 않은 토큰")
        void confirmPasswordReset_invalidToken() throws Exception {
            // given
            String token = "invalid-token";
            String newPassword = "newPassword123!";
            doThrow(new CustomException(ErrorCode.INVALID_RESET_TOKEN))
                .when(passwordResetService).resetPassword(token, newPassword);

            // when & then
            mockMvc.perform(post("/members/v1/password-reset/confirm")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"token\": \"" + token + "\", \"newPassword\": \"" + newPassword + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.message").value(ErrorCode.INVALID_RESET_TOKEN.getMessage()));
        }

        @Test
        @DisplayName("실패: 비밀번호 형식 오류")
        void confirmPasswordReset_invalidPassword() throws Exception {
            mockMvc.perform(post("/members/v1/password-reset/confirm")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"token\": \"valid-token\", \"newPassword\": \"short\"}"))
                .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("실패: 토큰 누락")
        void confirmPasswordReset_missingToken() throws Exception {
            mockMvc.perform(post("/members/v1/password-reset/confirm")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"newPassword\": \"newPassword123!\"}"))
                .andExpect(status().isBadRequest());
        }
    }
}

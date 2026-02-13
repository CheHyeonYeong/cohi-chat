package com.coDevs.cohiChat.member.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PasswordResetResponseDTO {
    private String message;

    public static PasswordResetResponseDTO requestSent() {
        return new PasswordResetResponseDTO("비밀번호 재설정 이메일이 발송되었습니다.");
    }

    public static PasswordResetResponseDTO resetSuccess() {
        return new PasswordResetResponseDTO("비밀번호가 성공적으로 변경되었습니다.");
    }
}

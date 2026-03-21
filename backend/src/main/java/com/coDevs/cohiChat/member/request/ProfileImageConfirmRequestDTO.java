package com.coDevs.cohiChat.member.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class ProfileImageConfirmRequestDTO {
    @NotBlank(message = "객체 키는 필수입니다.")
    private String objectKey;
}

package com.coDevs.cohiChat.member.request;

import jakarta.validation.constraints.NotBlank;

public record ProfileImageConfirmRequestDTO(
    @NotBlank(message = "객체 키는 필수입니다.")
    String objectKey
) {}

package com.coDevs.cohiChat.member.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record ProfileImageUploadRequestDTO(
    @NotBlank(message = "파일명은 필수입니다.")
    String fileName,

    @NotBlank(message = "Content-Type은 필수입니다.")
    String contentType,

    @Positive(message = "파일 크기는 양수여야 합니다.")
    long fileSize
) {}

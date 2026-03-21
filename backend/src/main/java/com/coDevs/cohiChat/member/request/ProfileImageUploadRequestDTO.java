package com.coDevs.cohiChat.member.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class ProfileImageUploadRequestDTO {
    @NotBlank(message = "파일명은 필수입니다.")
    private String fileName;

    @NotBlank(message = "Content-Type은 필수입니다.")
    private String contentType;

    @Positive(message = "파일 크기는 양수여야 합니다.")
    private long fileSize;
}

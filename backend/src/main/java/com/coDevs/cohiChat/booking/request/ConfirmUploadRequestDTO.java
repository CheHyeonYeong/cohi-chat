package com.coDevs.cohiChat.booking.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmUploadRequestDTO {

    @NotBlank(message = "objectKey는 필수 입력 항목입니다.")
    @Size(max = 500, message = "objectKey는 500자 이내로 입력해주세요.")
    private String objectKey;

    @NotBlank(message = "원본 파일명은 필수 입력 항목입니다.")
    @Size(max = 255, message = "원본 파일명은 255자 이내로 입력해주세요.")
    private String originalFileName;

    @NotBlank(message = "Content-Type은 필수 입력 항목입니다.")
    @Size(max = 100, message = "Content-Type은 100자 이내로 입력해주세요.")
    private String contentType;

    @NotNull(message = "파일 크기는 필수 입력 항목입니다.")
    @Positive(message = "파일 크기는 0보다 커야 합니다.")
    private Long fileSize;
}

package com.coDevs.cohiChat.booking.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PresignedUploadUrlRequestDTO {

    @NotBlank(message = "파일명은 필수 입력 항목입니다.")
    @Size(max = 255, message = "파일명은 255자 이내로 입력해주세요.")
    private String fileName;

    @NotBlank(message = "Content-Type은 필수 입력 항목입니다.")
    private String contentType;
}

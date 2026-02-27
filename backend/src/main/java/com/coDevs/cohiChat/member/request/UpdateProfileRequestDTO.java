package com.coDevs.cohiChat.member.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProfileRequestDTO {

        /**
         * 직업/역할. 빈 문자열("")을 전달하면 기존 값이 삭제(clear)됩니다.
         */
        @Size(max = 100)
        private String job;

        /**
         * 프로필 이미지 URL. 빈 문자열("")을 전달하면 기존 이미지가 삭제(clear)됩니다.
         */
        @Size(max = 500)
        @Pattern(regexp = "^$|https://.*", message = "HTTPS URL만 허용됩니다.")
        private String profileImageUrl;
}

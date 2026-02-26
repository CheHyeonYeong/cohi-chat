package com.coDevs.cohiChat.member.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UpdateProfileRequestDTO {

	@Size(max = 100)
	private String job;

	@Size(max = 500)
	@Pattern(regexp = "^$|https?://.*", message = "유효하지 않은 URL 형식입니다.")
	private String profileImageUrl;
}

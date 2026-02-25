package com.coDevs.cohiChat.member.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.URL;

@Getter
@NoArgsConstructor
public class UpdateProfileRequestDTO {

	@Size(max = 100)
	private String job;

	@Size(max = 500)
	@URL(message = "유효하지 않은 URL 형식입니다.")
	private String profileImageUrl;
}

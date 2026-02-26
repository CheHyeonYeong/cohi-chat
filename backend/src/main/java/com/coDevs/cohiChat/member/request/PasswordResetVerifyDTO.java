package com.coDevs.cohiChat.member.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PasswordResetVerifyDTO {

	@NotBlank(message = "토큰은 필수입니다.")
	private String token;
}

package com.coDevs.cohiChat.member.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetConfirmDTO {

	@NotBlank(message = "토큰은 필수입니다.")
	private String token;

	@NotBlank(message = "비밀번호는 필수입니다.")
	@Pattern(regexp = "^[a-zA-Z0-9!@#$%^&*._-]{8,20}$", message = "비밀번호는 8~20자의 영문, 숫자, 특수문자(!@#$%^&*._-)만 가능합니다.")
	private String password;
}

package com.coDevs.cohiChat.member.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PasswordResetConfirmDTO {

	@NotBlank(message = "토큰은 필수입니다.")
	private String token;

	@NotBlank(message = "새 비밀번호는 필수입니다.")
	@Size(min = 8, message = "비밀번호는 최소 8자 이상이어야 합니다.")
	private String newPassword;
}

package com.coDevs.cohiChat.member.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class DeleteMemberRequestDTO {

	@NotBlank(message = "사용자 아이디는 필수입니다.")
	private String username;

	@NotBlank(message = "비밀번호 확인이 필요합니다.")
	private String password;
}

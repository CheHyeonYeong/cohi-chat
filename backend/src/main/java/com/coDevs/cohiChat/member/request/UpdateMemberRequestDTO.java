package com.coDevs.cohiChat.member.request;

import jakarta.validation.constraints.NotBlank;
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
public class UpdateMemberRequestDTO {

	@NotBlank(message = "아이디는 필수입니다.")
	@Pattern(regexp = "^[a-zA-Z0-9._-]{4,12}$")
	private String username;

	@Size(min = 2, max = 20, message = "닉네임은 2자 이상 20자 이하로 입력해주세요.")
	private String displayName;

	@Pattern(regexp = "^[a-zA-Z0-9._-]{4,20}$")
	private String password;

}

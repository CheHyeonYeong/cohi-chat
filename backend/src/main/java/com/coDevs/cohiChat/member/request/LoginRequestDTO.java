package com.coDevs.cohiChat.member.request;

import com.coDevs.cohiChat.member.entity.Provider;

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
public class LoginRequestDTO {

	@NotBlank(message = "아이디는 필수입니다.")
	@Pattern(regexp = "^[a-zA-Z0-9._-]{4,12}$", message = "아이디는 4~12자의 영문, 숫자, 특수문자(._-)만 가능합니다.")
	private String username;

	@NotBlank(message = "비밀번호는 필수입니다.")
	@Pattern(regexp = "^[a-zA-Z0-9._-]{4,20}$", message = "비밀번호는 4~20자의 영문, 숫자, 특수문자(._-)만 가능합니다.")
	private String password;

	@Builder.Default
	private Provider provider = Provider.LOCAL;
}
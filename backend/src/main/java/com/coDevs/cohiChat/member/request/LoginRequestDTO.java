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
	private String username;

	@NotBlank(message = "비밀번호는 필수입니다.")
	private String password;

	@Builder.Default
	private Provider provider = Provider.LOCAL;
}
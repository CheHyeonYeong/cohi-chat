package com.coDevs.cohiChat.member.request;

import com.coDevs.cohiChat.member.entity.Provider;
import com.coDevs.cohiChat.member.entity.Role;

import jakarta.validation.constraints.Email;
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
public class SignupLocalRequestDTO {

	@NotBlank(message = "아이디는 필수입니다.")
	@Size(min = 4, max = 12)
	@Pattern(regexp = "^[a-zA-Z0-9._-]{4,20}$")
	private String username;

	@NotBlank(message = "비밀번호는 필수입니다.")
	private String password;

	@NotBlank(message = "이메일은 필수입니다.")
	@Email
	private String email;

	@NotBlank(message = "닉네임은 필수입니다.")
	@Size(min = 2, max = 20)
	private String displayName;

	@Builder.Default
	private Provider provider = Provider.LOCAL;

	@Builder.Default
	private Role role = Role.GUEST;

}
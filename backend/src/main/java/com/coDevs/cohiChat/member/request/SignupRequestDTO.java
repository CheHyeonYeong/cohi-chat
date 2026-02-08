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
public class SignupRequestDTO {

	@NotBlank(message = "아이디는 필수입니다.")
	@Pattern(regexp = "^(?i)(?!hosts$)[a-zA-Z0-9._-]{4,12}$", message = "아이디는 4~12자의 영문, 숫자, 특수문자(._-)만 가능하며, 예약어는 사용할 수 없습니다.")
	private String username;

	@NotBlank(message = "비밀번호는 필수입니다.")
	@Pattern(regexp = "^[a-zA-Z0-9!@#$%^&*._-]{8,20}$", message = "비밀번호는 8~20자의 영문, 숫자, 특수문자(!@#$%^&*._-)만 가능합니다.")
	private String password;

	@NotBlank(message = "이메일은 필수입니다.")
	@Email
	private String email;
	
	@Size(min = 2, max = 20)
	private String displayName;

	@Builder.Default
	private Provider provider = Provider.LOCAL;

	@Builder.Default
	private Role role = Role.GUEST;

}
package com.coDevs.cohiChat.member.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class DeleteMemberRequestDTO {

	@NotBlank(message = "사용자 아이디는 필수입니다.")
	private String username;

}

package com.coDevs.cohiChat.member.request;

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

	private String username;
	@Size(min = 2, max = 20)
	private String displayName;
	private String password;
}

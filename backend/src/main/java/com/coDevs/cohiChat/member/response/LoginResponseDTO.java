package com.coDevs.cohiChat.member.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponseDTO {

	private String accessToken;

	@Builder.Default
	private String tokenType = "Bearer";

	private String refreshToken;
	private String username;
	private String displayName;

}
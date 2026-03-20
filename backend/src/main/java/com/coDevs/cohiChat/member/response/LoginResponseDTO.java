package com.coDevs.cohiChat.member.response;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponseDTO {

	@JsonIgnore
	private String accessToken;
	private long expiredInMinutes;
	@JsonIgnore
	private String refreshToken;
	private String username;
	private String displayName;

}
package com.coDevs.cohiChat.member.response;

import com.coDevs.cohiChat.member.entity.Member;

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
	private long expiredIn;
	private String refreshToken;
	private String username;
	private String displayName;

}
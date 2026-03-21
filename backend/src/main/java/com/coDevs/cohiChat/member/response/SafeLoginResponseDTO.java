package com.coDevs.cohiChat.member.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SafeLoginResponseDTO {
	private String username;
	private String displayName;
	private long expiredInMinutes;
}

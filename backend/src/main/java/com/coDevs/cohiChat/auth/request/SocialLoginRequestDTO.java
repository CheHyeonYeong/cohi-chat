package com.coDevs.cohiChat.auth.request;

import com.coDevs.cohiChat.auth.entity.AuthProvider;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SuperBuilder
public class SocialLoginRequestDTO extends LoginRequestDTO {

	private String socialId;
	private String email;

	public static SocialLoginRequestDTO of(
		AuthProvider provider,
		String socialId,
		String email
	) {
		return SocialLoginRequestDTO.builder()
			.provider(provider)
			.socialId(socialId)
			.email(email)
			.build();
	}
}

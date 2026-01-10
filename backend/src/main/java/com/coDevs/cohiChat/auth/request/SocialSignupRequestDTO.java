package com.coDevs.cohiChat.auth.request;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SuperBuilder
public class SocialSignupRequestDTO extends SignupRequestDTO {

	private String providerUserId;

}
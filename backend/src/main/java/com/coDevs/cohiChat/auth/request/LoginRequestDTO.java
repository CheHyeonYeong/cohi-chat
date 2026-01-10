package com.coDevs.cohiChat.auth.request;

import com.coDevs.cohiChat.auth.entity.AuthProvider;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SuperBuilder
public abstract class LoginRequestDTO {
	private AuthProvider provider;
}
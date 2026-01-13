package com.coDevs.cohiChat.member.response;

import java.util.UUID;

import lombok.Getter;
import lombok.NoArgsConstructor;

import lombok.AllArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SignupResponseDTO {

	private UUID id;
	private String username;
	private String displayName;

}

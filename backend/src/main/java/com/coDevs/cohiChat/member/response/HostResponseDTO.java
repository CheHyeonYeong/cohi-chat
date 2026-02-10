package com.coDevs.cohiChat.member.response;

import java.util.UUID;

import com.coDevs.cohiChat.member.entity.Member;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class HostResponseDTO {
	private UUID id;
	private String username;
	private String displayName;

	public static HostResponseDTO from(Member member) {
		return HostResponseDTO.builder()
			.id(member.getId())
			.username(member.getUsername())
			.displayName(member.getDisplayName())
			.build();
	}
}

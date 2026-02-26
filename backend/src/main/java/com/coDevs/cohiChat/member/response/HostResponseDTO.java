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
	private String job;
	private String profileImageUrl;
	private long chatCount;

	public static HostResponseDTO from(Member member, long chatCount) {
		return HostResponseDTO.builder()
			.id(member.getId())
			.username(member.getUsername())
			.displayName(member.getDisplayName())
			.job(member.getJob())
			.profileImageUrl(member.getProfileImageUrl())
			.chatCount(chatCount)
			.build();
	}

	public static HostResponseDTO from(Member member) {
		return from(member, 0L);
	}
}

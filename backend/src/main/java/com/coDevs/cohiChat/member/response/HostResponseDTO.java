package com.coDevs.cohiChat.member.response;

import com.coDevs.cohiChat.member.entity.Member;

public record HostResponseDTO(String username, String displayName) {
	public static HostResponseDTO from(Member member) {
		return new HostResponseDTO(member.getUsername(), member.getDisplayName());
	}
}

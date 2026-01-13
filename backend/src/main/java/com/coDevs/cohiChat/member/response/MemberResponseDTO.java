package com.coDevs.cohiChat.member.response;

import java.time.LocalDateTime;
import java.util.UUID;

import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class MemberResponseDTO {
	private UUID id;
	private String username;
	private String displayName;
	private String email;
	private Role role;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;

	public static MemberResponseDTO from(Member member) {
		return MemberResponseDTO.builder()
			.id(member.getId())
			.username(member.getUsername())
			.displayName(member.getDisplayName())
			.email(member.getEmail())
			.role(member.getRole())
			.createdAt(member.getCreatedAt())
			.updatedAt(member.getUpdatedAt())
			.build();
	}
}

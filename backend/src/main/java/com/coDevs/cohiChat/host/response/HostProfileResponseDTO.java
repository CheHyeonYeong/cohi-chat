package com.coDevs.cohiChat.host.response;

import java.time.Instant;

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
public class HostProfileResponseDTO {
	private String username;
	private String displayName;
	private String email;
	private Instant hostRegisteredAt;
	private boolean calendarConnected;

	public static HostProfileResponseDTO from(Member member, boolean calendarConnected) {
		return HostProfileResponseDTO.builder()
			.username(member.getUsername())
			.displayName(member.getDisplayName())
			.email(member.getEmail())
			.hostRegisteredAt(member.getHostRegisteredAt())
			.calendarConnected(calendarConnected)
			.build();
	}
}

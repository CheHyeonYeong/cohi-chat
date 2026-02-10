package com.coDevs.cohiChat.hostrequest.response;

import java.time.Instant;

import com.coDevs.cohiChat.hostrequest.entity.HostRequest;
import com.coDevs.cohiChat.hostrequest.entity.HostRequestStatus;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class HostRequestResponseDTO {

	private Long id;
	private String username;
	private String displayName;
	private HostRequestStatus status;
	private Instant createdAt;
	private Instant processedAt;

	public static HostRequestResponseDTO from(HostRequest hostRequest) {
		return HostRequestResponseDTO.builder()
			.id(hostRequest.getId())
			.username(hostRequest.getMember().getUsername())
			.displayName(hostRequest.getMember().getDisplayName())
			.status(hostRequest.getStatus())
			.createdAt(hostRequest.getCreatedAt())
			.processedAt(hostRequest.getProcessedAt())
			.build();
	}
}

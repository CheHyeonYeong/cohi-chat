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
	// TODO: [#220 정책 검토] email 필드 노출 범위 팀 논의 필요
	//  - 현재: 호스트 프로필 조회 시 email이 항상 응답에 포함됨
	//  - 내부 API(호스트 본인 조회)에서만 노출할지, 공개 API에서도 노출할지 정책 결정 필요
	//  - 공개 API 노출 시 개인정보 보호 관점에서 마스킹 처리 검토 (예: t***@test.com)
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

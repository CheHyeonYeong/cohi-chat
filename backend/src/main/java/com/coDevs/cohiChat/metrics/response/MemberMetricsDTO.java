package com.coDevs.cohiChat.metrics.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class MemberMetricsDTO {
	private long totalMembers;
	private long guestCount;
	private long hostCount;
	private long adminCount;
	private long localAuthCount;
	private long googleAuthCount;
	private long kakaoAuthCount;
}

package com.coDevs.cohiChat.metrics.response;

public record MemberMetricsDTO(
	long totalMembers,
	long guestCount,
	long hostCount,
	long adminCount,
	long localAuthCount,
	long googleAuthCount,
	long kakaoAuthCount
) {}

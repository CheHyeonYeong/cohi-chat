package com.coDevs.cohiChat.metrics.response;

import java.time.Instant;

public record BusinessMetricsDTO(
	Instant generatedAt,
	MemberMetricsDTO members,
	BookingMetricsDTO bookings
) {}

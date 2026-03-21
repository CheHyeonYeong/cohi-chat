package com.coDevs.cohiChat.metrics.response;

import java.time.Instant;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class BusinessMetricsDTO {
	private Instant generatedAt;
	private MemberMetricsDTO members;
	private BookingMetricsDTO bookings;
}

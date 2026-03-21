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
public class BookingMetricsDTO {
	private long totalBookings;
	private long scheduledBookings;
	private long attendedBookings;
	private long cancelledBookings;
	private long noShowBookings;
	private long todayBookings;
	private long thisWeekBookings;
	private long thisMonthBookings;
}

package com.coDevs.cohiChat.metrics.response;

public record BookingMetricsDTO(
	long totalBookings,
	long scheduledBookings,
	long attendedBookings,
	long cancelledBookings,
	long noShowBookings,
	long todayBookings,
	long thisWeekBookings,
	long thisMonthBookings
) {}

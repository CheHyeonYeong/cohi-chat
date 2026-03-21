package com.coDevs.cohiChat.metrics;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.EnumMap;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.booking.BookingRepository;
import com.coDevs.cohiChat.booking.BookingRepository.PeriodCount;
import com.coDevs.cohiChat.booking.entity.AttendanceStatus;
import com.coDevs.cohiChat.member.MemberRepository;
import com.coDevs.cohiChat.member.entity.Provider;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.metrics.response.BookingMetricsDTO;
import com.coDevs.cohiChat.metrics.response.BusinessMetricsDTO;
import com.coDevs.cohiChat.metrics.response.MemberMetricsDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MetricsService {

	private final MemberRepository memberRepository;
	private final BookingRepository bookingRepository;

	@Transactional(readOnly = true)
	public BusinessMetricsDTO getBusinessMetrics() {
		return new BusinessMetricsDTO(
			Instant.now(),
			getMemberMetrics(),
			getBookingMetrics()
		);
	}

	private MemberMetricsDTO getMemberMetrics() {
		Map<Role, Long> roleCounts = memberRepository.countByRole().stream()
			.collect(() -> new EnumMap<>(Role.class),
				(map, rc) -> map.put(rc.getRole(), rc.getCount()),
				EnumMap::putAll);

		Map<Provider, Long> providerCounts = memberRepository.countByProvider().stream()
			.collect(() -> new EnumMap<>(Provider.class),
				(map, pc) -> map.put(pc.getProvider(), pc.getCount()),
				EnumMap::putAll);

		long guestCount = roleCounts.getOrDefault(Role.GUEST, 0L);
		long hostCount = roleCounts.getOrDefault(Role.HOST, 0L);
		long adminCount = roleCounts.getOrDefault(Role.ADMIN, 0L);

		return new MemberMetricsDTO(
			guestCount + hostCount + adminCount,
			guestCount,
			hostCount,
			adminCount,
			providerCounts.getOrDefault(Provider.LOCAL, 0L),
			providerCounts.getOrDefault(Provider.GOOGLE, 0L),
			providerCounts.getOrDefault(Provider.KAKAO, 0L)
		);
	}

	private BookingMetricsDTO getBookingMetrics() {
		Map<AttendanceStatus, Long> statusCounts = bookingRepository.countByStatus().stream()
			.collect(() -> new EnumMap<>(AttendanceStatus.class),
				(map, sc) -> map.put(sc.getStatus(), sc.getCount()),
				EnumMap::putAll);

		LocalDate today = LocalDate.now();
		LocalDate weekStart = today.with(DayOfWeek.MONDAY);
		LocalDate monthStart = today.with(TemporalAdjusters.firstDayOfMonth());

		PeriodCount periodCount = bookingRepository.countByPeriods(
			today, weekStart, weekStart.plusWeeks(1), monthStart, monthStart.plusMonths(1)
		);

		long totalBookings = statusCounts.values().stream().mapToLong(Long::longValue).sum();

		return new BookingMetricsDTO(
			totalBookings,
			statusCounts.getOrDefault(AttendanceStatus.SCHEDULED, 0L),
			statusCounts.getOrDefault(AttendanceStatus.ATTENDED, 0L),
			statusCounts.getOrDefault(AttendanceStatus.CANCELLED, 0L)
				+ statusCounts.getOrDefault(AttendanceStatus.SAME_DAY_CANCEL, 0L),
			statusCounts.getOrDefault(AttendanceStatus.NO_SHOW, 0L)
				+ statusCounts.getOrDefault(AttendanceStatus.HOST_NO_SHOW, 0L),
			nullToZero(periodCount.getTodayCount()),
			nullToZero(periodCount.getWeekCount()),
			nullToZero(periodCount.getMonthCount())
		);
	}

	private static long nullToZero(Long value) {
		return value != null ? value : 0L;
	}
}

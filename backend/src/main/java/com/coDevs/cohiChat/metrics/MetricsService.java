package com.coDevs.cohiChat.metrics;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.booking.BookingRepository;
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
		return BusinessMetricsDTO.builder()
			.generatedAt(Instant.now())
			.members(getMemberMetrics())
			.bookings(getBookingMetrics())
			.build();
	}

	private MemberMetricsDTO getMemberMetrics() {
		long guestCount = memberRepository.countByRoleAndIsDeletedFalse(Role.GUEST);
		long hostCount = memberRepository.countByRoleAndIsDeletedFalse(Role.HOST);
		long adminCount = memberRepository.countByRoleAndIsDeletedFalse(Role.ADMIN);
		long totalMembers = guestCount + hostCount + adminCount;

		long localAuthCount = memberRepository.countByProviderAndIsDeletedFalse(Provider.LOCAL);
		long googleAuthCount = memberRepository.countByProviderAndIsDeletedFalse(Provider.GOOGLE);
		long kakaoAuthCount = memberRepository.countByProviderAndIsDeletedFalse(Provider.KAKAO);

		return MemberMetricsDTO.builder()
			.totalMembers(totalMembers)
			.guestCount(guestCount)
			.hostCount(hostCount)
			.adminCount(adminCount)
			.localAuthCount(localAuthCount)
			.googleAuthCount(googleAuthCount)
			.kakaoAuthCount(kakaoAuthCount)
			.build();
	}

	private BookingMetricsDTO getBookingMetrics() {
		LocalDate today = LocalDate.now();
		LocalDate weekStart = today.with(java.time.DayOfWeek.MONDAY);
		LocalDate monthStart = today.with(TemporalAdjusters.firstDayOfMonth());
		LocalDate nextMonth = monthStart.plusMonths(1);
		LocalDate nextWeek = weekStart.plusWeeks(1);

		long totalBookings = bookingRepository.count();
		long scheduledBookings = bookingRepository.countByAttendanceStatus(AttendanceStatus.SCHEDULED);
		long attendedBookings = bookingRepository.countByAttendanceStatus(AttendanceStatus.ATTENDED);
		long cancelledBookings = bookingRepository.countByAttendanceStatus(AttendanceStatus.CANCELLED)
			+ bookingRepository.countByAttendanceStatus(AttendanceStatus.SAME_DAY_CANCEL);
		long noShowBookings = bookingRepository.countByAttendanceStatus(AttendanceStatus.NO_SHOW)
			+ bookingRepository.countByAttendanceStatus(AttendanceStatus.HOST_NO_SHOW);

		long todayBookings = bookingRepository.countByBookingDate(today);
		long thisWeekBookings = bookingRepository.countByBookingDateBetween(weekStart, nextWeek);
		long thisMonthBookings = bookingRepository.countByBookingDateBetween(monthStart, nextMonth);

		return BookingMetricsDTO.builder()
			.totalBookings(totalBookings)
			.scheduledBookings(scheduledBookings)
			.attendedBookings(attendedBookings)
			.cancelledBookings(cancelledBookings)
			.noShowBookings(noShowBookings)
			.todayBookings(todayBookings)
			.thisWeekBookings(thisWeekBookings)
			.thisMonthBookings(thisMonthBookings)
			.build();
	}
}

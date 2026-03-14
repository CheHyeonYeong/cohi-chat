package com.coDevs.cohiChat.booking.controller;

import java.time.LocalDate;

import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.booking.BookingRepository;
import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.member.MemberRepository;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.timeslot.TimeSlotRepository;
import com.coDevs.cohiChat.timeslot.entity.TimeSlot;

import lombok.RequiredArgsConstructor;

/**
 * 로컬 개발 전용 컨트롤러 - 프로덕션 빌드에 절대 포함되지 않음
 * 노쇼 신고 기능처럼 미팅 시작 이후에만 가능한 기능을 로컬에서 테스트할 때 사용
 */
@Profile("local")
@RestController
@RequestMapping("/dev/bookings")
@RequiredArgsConstructor
public class DevBookingController {

    private final BookingRepository bookingRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final MemberRepository memberRepository;

    /**
     * 과거 날짜로 예약을 직접 생성 (일반 예약 API의 미래 날짜 검증 우회)
     * 로그인한 사용자가 자동으로 게스트로 지정됨
     *
     * @param timeSlotId 사용할 타임슬롯 ID
     * @param daysAgo    며칠 전 예약으로 생성할지 (기본값 1)
     * @return 생성된 예약 ID
     */
    @PostMapping("/past")
    public ResponseEntity<Long> createPastBooking(
        @AuthenticationPrincipal UserDetails userDetails,
        @RequestParam Long timeSlotId,
        @RequestParam(defaultValue = "1") int daysAgo
    ) {
        Member guest = memberRepository.findByUsernameAndIsDeletedFalse(userDetails.getUsername())
            .orElseThrow(() -> new IllegalArgumentException("Member not found: " + userDetails.getUsername()));

        TimeSlot timeSlot = timeSlotRepository.findById(timeSlotId)
            .orElseThrow(() -> new IllegalArgumentException("TimeSlot not found: " + timeSlotId));

        LocalDate pastDate = LocalDate.now().minusDays(daysAgo);
        Booking booking = Booking.create(timeSlot, guest.getId(), pastDate, "[DEV] 노쇼 테스트 예약", "로컬 테스트용 과거 예약입니다.");
        Booking saved = bookingRepository.save(booking);

        return ResponseEntity.ok(saved.getId());
    }
}

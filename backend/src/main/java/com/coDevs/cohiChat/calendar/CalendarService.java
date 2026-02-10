package com.coDevs.cohiChat.calendar;

import java.util.List;
import java.util.Optional;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.booking.BookingService;
import com.coDevs.cohiChat.booking.response.BookingPublicResponseDTO;
import com.coDevs.cohiChat.calendar.entity.Calendar;
import com.coDevs.cohiChat.calendar.request.CalendarCreateRequestDTO;
import com.coDevs.cohiChat.calendar.request.CalendarUpdateRequestDTO;
import com.coDevs.cohiChat.calendar.response.CalendarPublicResponseDTO;
import com.coDevs.cohiChat.calendar.response.CalendarResponseDTO;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.MemberRepository;
import com.coDevs.cohiChat.member.MemberService;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CalendarService {

    private final CalendarRepository calendarRepository;
    private final MemberRepository memberRepository;
    private final MemberService memberService;
    private final BookingService bookingService;

    @Transactional
    public CalendarResponseDTO createCalendar(Member member, CalendarCreateRequestDTO request) {
        validateCalendarNotExists(member);

        // GUEST → HOST 자동 승격
        if (member.getRole() == Role.GUEST) {
            member.promoteToHost();
            memberRepository.save(member);
        }

        Calendar calendar = Calendar.create(
            member.getId(),
            request.getTopics(),
            request.getDescription(),
            request.getGoogleCalendarId()
        );

        try {
            Calendar savedCalendar = calendarRepository.save(calendar);
            return CalendarResponseDTO.from(savedCalendar);
        } catch (DataIntegrityViolationException e) {
            throw new CustomException(ErrorCode.CALENDAR_ALREADY_EXISTS);
        }
    }

    @Transactional(readOnly = true)
    public CalendarResponseDTO getCalendar(Member member) {
        validateHostPermission(member);

        Calendar calendar = calendarRepository.findByUserId(member.getId())
            .orElseThrow(() -> new CustomException(ErrorCode.CALENDAR_NOT_FOUND));

        return CalendarResponseDTO.from(calendar);
    }

    @Transactional
    public CalendarResponseDTO updateCalendar(Member member, CalendarUpdateRequestDTO request) {
        validateHostPermission(member);

        Calendar calendar = calendarRepository.findByUserId(member.getId())
            .orElseThrow(() -> new CustomException(ErrorCode.CALENDAR_NOT_FOUND));

        calendar.update(
            request.getTopics(),
            request.getDescription(),
            request.getGoogleCalendarId()
        );

        return CalendarResponseDTO.from(calendar);
    }

    /**
     * 공개 API용 캘린더 조회.
     * 사용자 열거 방지를 위해 Member/Calendar 미존재 모두 동일한 에러 반환.
     */
    @Transactional(readOnly = true)
    public CalendarPublicResponseDTO getCalendarBySlugPublic(String slug) {
        Optional<Member> memberOpt = memberService.findMember(slug);
        if (memberOpt.isEmpty()) {
            throw new CustomException(ErrorCode.CALENDAR_NOT_FOUND);
        }

        Calendar calendar = calendarRepository.findByUserId(memberOpt.get().getId())
            .orElseThrow(() -> new CustomException(ErrorCode.CALENDAR_NOT_FOUND));

        return CalendarPublicResponseDTO.from(calendar);
    }

    /**
     * 공개 API용 예약 목록 조회.
     * 사용자 열거 방지를 위해 Member/Calendar 미존재 모두 동일한 에러 반환.
     */
    @Transactional(readOnly = true)
    public List<BookingPublicResponseDTO> getBookingsBySlug(String slug, int year, int month) {
        Optional<Member> memberOpt = memberService.findMember(slug);
        if (memberOpt.isEmpty()) {
            throw new CustomException(ErrorCode.CALENDAR_NOT_FOUND);
        }

        // 캘린더 존재 여부 확인
        if (!calendarRepository.existsByUserId(memberOpt.get().getId())) {
            throw new CustomException(ErrorCode.CALENDAR_NOT_FOUND);
        }

        return bookingService.getBookingsByHostAndDate(memberOpt.get().getId(), year, month);
    }

    private void validateHostPermission(Member member) {
        if (member.getRole() != Role.HOST) {
            throw new CustomException(ErrorCode.GUEST_ACCESS_DENIED );
        }
    }

    private void validateCalendarNotExists(Member member) {
        if (calendarRepository.existsByUserId(member.getId())) {
            throw new CustomException(ErrorCode.CALENDAR_ALREADY_EXISTS);
        }
    }
}

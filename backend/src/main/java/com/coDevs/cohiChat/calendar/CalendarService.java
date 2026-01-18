package com.coDevs.cohiChat.calendar;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.calendar.entity.Calendar;
import com.coDevs.cohiChat.calendar.request.CalendarCreateRequestDTO;
import com.coDevs.cohiChat.calendar.request.CalendarUpdateRequestDTO;
import com.coDevs.cohiChat.calendar.response.CalendarResponseDTO;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CalendarService {

    private final CalendarRepository calendarRepository;

    @Transactional
    public CalendarResponseDTO createCalendar(Member member, CalendarCreateRequestDTO request) {
        validateHostPermission(member);
        validateCalendarNotExists(member);

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

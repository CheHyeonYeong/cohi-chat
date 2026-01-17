package com.coDevs.cohiChat.calendar;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.calendar.entity.Calendar;
import com.coDevs.cohiChat.calendar.request.CalendarCreateRequestDTO;
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

        Calendar savedCalendar = calendarRepository.save(calendar);
        return CalendarResponseDTO.from(savedCalendar);
    }

    private void validateHostPermission(Member member) {
        if (member.getRole() != Role.HOST) {
            throw new CustomException(ErrorCode.GUEST_PERMISSION);
        }
    }

    private void validateCalendarNotExists(Member member) {
        if (calendarRepository.existsByUserIdAndIsDeletedFalse(member.getId())) {
            throw new CustomException(ErrorCode.CALENDAR_ALREADY_EXISTS);
        }
    }
}

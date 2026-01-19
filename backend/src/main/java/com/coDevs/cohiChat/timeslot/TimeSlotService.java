package com.coDevs.cohiChat.timeslot;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.calendar.CalendarRepository;
import com.coDevs.cohiChat.calendar.entity.Calendar;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.MemberRepository;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.timeslot.entity.TimeSlot;
import com.coDevs.cohiChat.timeslot.request.TimeSlotCreateRequestDTO;
import com.coDevs.cohiChat.timeslot.response.TimeSlotResponseDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TimeSlotService {

    private final TimeSlotRepository timeSlotRepository;
    private final CalendarRepository calendarRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public TimeSlotResponseDTO createTimeSlot(Member member, TimeSlotCreateRequestDTO request) {
        validateHostPermission(member);

        Calendar calendar = calendarRepository.findByUserId(member.getId())
            .orElseThrow(() -> new CustomException(ErrorCode.CALENDAR_NOT_FOUND));

        validateNoOverlappingTimeSlots(calendar.getUserId(), request);

        TimeSlot timeSlot = TimeSlot.create(
            calendar.getUserId(),
            request.getStartTime(),
            request.getEndTime(),
            request.getWeekdays()
        );

        TimeSlot savedTimeSlot = timeSlotRepository.save(timeSlot);
        return TimeSlotResponseDTO.from(savedTimeSlot);
    }

    @Transactional(readOnly = true)
    public List<TimeSlotResponseDTO> getTimeSlotsByHost(Member member) {
        validateHostPermission(member);
        return getTimeSlotsByUserId(member.getId());
    }

    @Transactional(readOnly = true)
    public List<TimeSlotResponseDTO> getTimeSlotsByHostId(UUID hostId) {
        memberRepository.findByIdAndRoleAndIsDeletedFalse(hostId, Role.HOST)
            .orElseThrow(() -> new CustomException(ErrorCode.HOST_NOT_FOUND));
        return getTimeSlotsByUserId(hostId);
    }

    private List<TimeSlotResponseDTO> getTimeSlotsByUserId(UUID userId) {
        calendarRepository.findByUserId(userId)
            .orElseThrow(() -> new CustomException(ErrorCode.CALENDAR_NOT_FOUND));

        return timeSlotRepository.findByUserIdOrderByStartTimeAsc(userId).stream()
            .map(TimeSlotResponseDTO::from)
            .toList();
    }

    private void validateHostPermission(Member member) {
        if (member.getRole() != Role.HOST) {
            throw new CustomException(ErrorCode.GUEST_ACCESS_DENIED);
        }
    }

    private void validateNoOverlappingTimeSlots(UUID userId, TimeSlotCreateRequestDTO request) {
        List<TimeSlot> overlappingTimeSlots = timeSlotRepository.findOverlappingTimeSlots(
            userId,
            request.getStartTime(),
            request.getEndTime()
        );

        for (TimeSlot existingSlot : overlappingTimeSlots) {
            if (existingSlot.isOverlapping(request.getStartTime(), request.getEndTime(), request.getWeekdays())) {
                throw new CustomException(ErrorCode.TIMESLOT_OVERLAP);
            }
        }
    }
}

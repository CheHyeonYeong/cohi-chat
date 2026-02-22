package com.coDevs.cohiChat.member.event;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.coDevs.cohiChat.booking.entity.Booking;
import com.coDevs.cohiChat.member.entity.Role;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 회원 탈퇴 완료 후 발행되는 이벤트.
 * 트랜잭션 커밋 후 Google Calendar 이벤트 삭제에 사용.
 */
@Getter
@RequiredArgsConstructor
public class MemberWithdrawalEvent {

    private final UUID memberId;
    private final Role memberRole;
    private final List<Booking> hostBookings;
    private final List<Booking> guestBookings;
    private final LocalDate today;
}

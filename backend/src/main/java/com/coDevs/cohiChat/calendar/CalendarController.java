package com.coDevs.cohiChat.calendar;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.calendar.request.CalendarCreateRequestDTO;
import com.coDevs.cohiChat.calendar.request.CalendarUpdateRequestDTO;
import com.coDevs.cohiChat.calendar.response.CalendarResponseDTO;
import com.coDevs.cohiChat.member.MemberService;
import com.coDevs.cohiChat.member.entity.Member;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/calendar")
@RequiredArgsConstructor
public class CalendarController {

    private final CalendarService calendarService;
    private final MemberService memberService;

    @PostMapping("/v1")
    public ResponseEntity<CalendarResponseDTO> createCalendar(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CalendarCreateRequestDTO request
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        CalendarResponseDTO response = calendarService.createCalendar(member, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/v1")
    public ResponseEntity<CalendarResponseDTO> getCalendar(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        CalendarResponseDTO response = calendarService.getCalendar(member);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/v1")
    public ResponseEntity<CalendarResponseDTO> updateCalendar(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CalendarUpdateRequestDTO request
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        CalendarResponseDTO response = calendarService.updateCalendar(member, request);
        return ResponseEntity.ok(response);
    }
}

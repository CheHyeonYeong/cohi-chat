package com.coDevs.cohiChat.timeslot;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.member.MemberService;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.timeslot.request.TimeSlotCreateRequestDTO;
import com.coDevs.cohiChat.timeslot.response.TimeSlotResponseDTO;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/timeslot")
@RequiredArgsConstructor
public class TimeSlotController {

    private final TimeSlotService timeSlotService;
    private final MemberService memberService;

    @PostMapping("/v1")
    public ResponseEntity<TimeSlotResponseDTO> createTimeSlot(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TimeSlotCreateRequestDTO request
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        TimeSlotResponseDTO response = timeSlotService.createTimeSlot(member, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/v1")
    public ResponseEntity<List<TimeSlotResponseDTO>> getTimeSlots(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        List<TimeSlotResponseDTO> response = timeSlotService.getTimeSlotsByHost(member);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/v1/hosts/{hostId}")
    public ResponseEntity<List<TimeSlotResponseDTO>> getTimeSlotsByHostId(
            @PathVariable UUID hostId
    ) {
        List<TimeSlotResponseDTO> response = timeSlotService.getTimeSlotsByHostId(hostId);
        return ResponseEntity.ok(response);
    }
}

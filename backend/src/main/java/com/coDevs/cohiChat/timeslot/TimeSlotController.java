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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "TimeSlot", description = "타임슬롯 관리 API")
@RestController
@RequestMapping("/timeslot")
@RequiredArgsConstructor
public class TimeSlotController {

    private final TimeSlotService timeSlotService;
    private final MemberService memberService;

    @Operation(summary = "타임슬롯 생성", description = "호스트가 새로운 타임슬롯을 생성합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "타임슬롯 생성 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청"),
        @ApiResponse(responseCode = "401", description = "인증 필요"),
        @ApiResponse(responseCode = "403", description = "호스트 권한 필요"),
        @ApiResponse(responseCode = "409", description = "시간대 중복")
    })
    @PostMapping("/v1")
    public ResponseEntity<TimeSlotResponseDTO> createTimeSlot(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TimeSlotCreateRequestDTO request
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        TimeSlotResponseDTO response = timeSlotService.createTimeSlot(member, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "내 타임슬롯 조회", description = "호스트가 자신의 타임슬롯 목록을 조회합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "401", description = "인증 필요"),
        @ApiResponse(responseCode = "403", description = "호스트 권한 필요"),
        @ApiResponse(responseCode = "404", description = "캘린더를 찾을 수 없음")
    })
    @GetMapping("/v1")
    public ResponseEntity<List<TimeSlotResponseDTO>> getTimeSlots(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        List<TimeSlotResponseDTO> response = timeSlotService.getTimeSlotsByHost(member);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "호스트 타임슬롯 조회", description = "게스트가 특정 호스트의 타임슬롯 목록을 조회합니다. 인증 없이 접근 가능합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "404", description = "호스트 또는 캘린더를 찾을 수 없음")
    })
    @GetMapping("/v1/hosts/{hostId}")
    public ResponseEntity<List<TimeSlotResponseDTO>> getTimeSlotsByHostId(
            @Parameter(description = "호스트 ID (UUID)", required = true)
            @PathVariable UUID hostId
    ) {
        List<TimeSlotResponseDTO> response = timeSlotService.getTimeSlotsByHostId(hostId);
        return ResponseEntity.ok(response);
    }
}

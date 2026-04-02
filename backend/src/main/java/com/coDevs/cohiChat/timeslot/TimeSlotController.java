package com.coDevs.cohiChat.timeslot;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.global.response.ApiResponseDTO;
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

@Tag(name = "TimeSlot", description = "Time slot management API")
@RestController
@RequestMapping("/timeslot")
@RequiredArgsConstructor
public class TimeSlotController {

    private final TimeSlotService timeSlotService;
    private final MemberService memberService;

    @Operation(summary = "Create time slot", description = "Create a new time slot for the authenticated host.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Time slot created"),
        @ApiResponse(responseCode = "400", description = "Invalid request"),
        @ApiResponse(responseCode = "401", description = "Authentication required"),
        @ApiResponse(responseCode = "403", description = "Host role required"),
        @ApiResponse(responseCode = "409", description = "Overlapping time slot")
    })
    @PostMapping("/v1")
    public ResponseEntity<ApiResponseDTO<TimeSlotResponseDTO>> createTimeSlot(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TimeSlotCreateRequestDTO request
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        TimeSlotResponseDTO response = timeSlotService.createTimeSlot(member, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponseDTO.success(response));
    }

    @Operation(summary = "Get my time slots", description = "Get all time slots owned by the authenticated host.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Lookup succeeded"),
        @ApiResponse(responseCode = "401", description = "Authentication required"),
        @ApiResponse(responseCode = "403", description = "Host role required"),
        @ApiResponse(responseCode = "404", description = "Calendar not found")
    })
    @GetMapping("/v1")
    public ResponseEntity<ApiResponseDTO<List<TimeSlotResponseDTO>>> getTimeSlots(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        List<TimeSlotResponseDTO> response = timeSlotService.getTimeSlotsByHost(member);
        return ResponseEntity.ok(ApiResponseDTO.success(response));
    }

    @Operation(summary = "Delete time slot", description = "Soft delete one of the authenticated host's time slots.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Time slot deleted"),
        @ApiResponse(responseCode = "401", description = "Authentication required"),
        @ApiResponse(responseCode = "403", description = "Host role required or not the owner's time slot"),
        @ApiResponse(responseCode = "404", description = "Time slot not found")
    })
    @DeleteMapping("/v1/{timeSlotId}")
    public ResponseEntity<ApiResponseDTO<Void>> deleteTimeSlot(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "Time slot ID", required = true)
            @PathVariable Long timeSlotId
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        timeSlotService.deleteTimeSlot(member, timeSlotId);
        return ResponseEntity.ok(ApiResponseDTO.success(null));
    }

    @Operation(summary = "Update time slot", description = "Update one of the authenticated host's time slots.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Time slot updated"),
        @ApiResponse(responseCode = "400", description = "Invalid request"),
        @ApiResponse(responseCode = "401", description = "Authentication required"),
        @ApiResponse(responseCode = "403", description = "Host role required or not the owner's time slot"),
        @ApiResponse(responseCode = "404", description = "Time slot not found"),
        @ApiResponse(responseCode = "409", description = "Overlapping time slot")
    })
    @PatchMapping("/v1/{timeSlotId}")
    public ResponseEntity<ApiResponseDTO<TimeSlotResponseDTO>> updateTimeSlot(
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "Time slot ID", required = true)
            @PathVariable Long timeSlotId,
            @Valid @RequestBody TimeSlotCreateRequestDTO request
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        TimeSlotResponseDTO response = timeSlotService.updateTimeSlot(member, timeSlotId, request);
        return ResponseEntity.ok(ApiResponseDTO.success(response));
    }

    @Operation(summary = "Get host time slots", description = "Get public time slots for a specific host.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Lookup succeeded"),
        @ApiResponse(responseCode = "404", description = "Host or calendar not found")
    })
    @GetMapping("/v1/hosts/{hostId}")
    public ResponseEntity<ApiResponseDTO<List<TimeSlotResponseDTO>>> getTimeSlotsByHostId(
            @Parameter(description = "Host ID (UUID)", required = true)
            @PathVariable UUID hostId
    ) {
        List<TimeSlotResponseDTO> response = timeSlotService.getTimeSlotsByHostId(hostId);
        return ResponseEntity.ok(ApiResponseDTO.success(response));
    }
}

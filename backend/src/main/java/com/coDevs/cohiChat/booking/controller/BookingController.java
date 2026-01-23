package com.coDevs.cohiChat.booking.controller;

import java.util.List;

import com.coDevs.cohiChat.booking.BookingService;
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

import com.coDevs.cohiChat.booking.request.BookingCreateRequestDTO;
import com.coDevs.cohiChat.booking.response.BookingResponseDTO;
import com.coDevs.cohiChat.member.MemberService;
import com.coDevs.cohiChat.member.entity.Member;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "Booking", description = "예약 관리 API")
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final MemberService memberService;

    @Operation(summary = "예약 생성", description = "호스트의 타임슬롯에 게스트가 예약을 생성합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "예약 생성 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청 (입력값 검증 실패)"),
        @ApiResponse(responseCode = "401", description = "인증 필요"),
        @ApiResponse(responseCode = "404", description = "타임슬롯을 찾을 수 없음"),
        @ApiResponse(responseCode = "409", description = "이미 예약된 시간대"),
        @ApiResponse(responseCode = "422", description = "비즈니스 규칙 위반 (자기 예약, 과거 날짜, 요일 불가)")
    })
    @PostMapping
    public ResponseEntity<BookingResponseDTO> createBooking(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody BookingCreateRequestDTO request
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        BookingResponseDTO response = bookingService.createBooking(member, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "예약 상세 조회", description = "예약 ID로 예약 상세 정보를 조회합니다. 본인이 게스트 또는 호스트인 예약만 조회 가능합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "401", description = "인증 필요"),
        @ApiResponse(responseCode = "403", description = "접근 권한 없음"),
        @ApiResponse(responseCode = "404", description = "예약을 찾을 수 없음")
    })
    @GetMapping("/{bookingId}")
    public ResponseEntity<BookingResponseDTO> getBookingById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long bookingId
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        BookingResponseDTO response = bookingService.getBookingById(bookingId, member.getId());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "내 예약 조회 (게스트)", description = "내가 게스트로 신청한 예약 목록을 조회합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "401", description = "인증 필요")
    })
    @GetMapping("/guest/me")
    public ResponseEntity<List<BookingResponseDTO>> getMyBookingsAsGuest(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        List<BookingResponseDTO> responses = bookingService.getBookingsByGuestId(member.getId());
        return ResponseEntity.ok(responses);
    }

    @Operation(summary = "내 예약 조회 (호스트)", description = "내가 호스트로 받은 예약 목록을 조회합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "401", description = "인증 필요")
    })
    @GetMapping("/host/me")
    public ResponseEntity<List<BookingResponseDTO>> getMyBookingsAsHost(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        List<BookingResponseDTO> responses = bookingService.getBookingsByHostId(member.getId());
        return ResponseEntity.ok(responses);
    }
}

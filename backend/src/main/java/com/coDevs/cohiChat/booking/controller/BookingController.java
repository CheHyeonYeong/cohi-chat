package com.coDevs.cohiChat.booking.controller;

import java.util.List;

import com.coDevs.cohiChat.booking.BookingService;
import com.coDevs.cohiChat.global.response.ApiResponseDTO;
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

import com.coDevs.cohiChat.booking.request.BookingCreateRequestDTO;
import com.coDevs.cohiChat.booking.request.BookingScheduleUpdateRequestDTO;
import com.coDevs.cohiChat.booking.request.BookingStatusUpdateRequestDTO;
import com.coDevs.cohiChat.booking.request.BookingUpdateRequestDTO;
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
@RequestMapping("/bookings")
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
    public ResponseEntity<ApiResponseDTO<BookingResponseDTO>> createBooking(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody BookingCreateRequestDTO request
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        BookingResponseDTO response = bookingService.createBooking(member, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponseDTO.success(response));
    }

    @Operation(summary = "예약 상세 조회", description = "예약 ID로 예약 상세 정보를 조회합니다. 본인이 게스트 또는 호스트인 예약만 조회 가능합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "401", description = "인증 필요"),
        @ApiResponse(responseCode = "403", description = "접근 권한 없음"),
        @ApiResponse(responseCode = "404", description = "예약을 찾을 수 없음")
    })
    @GetMapping("/{bookingId}")
    public ResponseEntity<ApiResponseDTO<BookingResponseDTO>> getBookingById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long bookingId
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        BookingResponseDTO response = bookingService.getBookingById(bookingId, member.getId());
        return ResponseEntity.ok(ApiResponseDTO.success(response));
    }

    @Operation(summary = "내 예약 조회 (게스트)", description = "내가 게스트로 신청한 예약 목록을 조회합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "401", description = "인증 필요")
    })
    @GetMapping("/guest/me")
    public ResponseEntity<ApiResponseDTO<List<BookingResponseDTO>>> getMyBookingsAsGuest(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        List<BookingResponseDTO> responses = bookingService.getBookingsByGuestId(member.getId());
        return ResponseEntity.ok(ApiResponseDTO.success(responses));
    }

    @Operation(summary = "내 예약 조회 (호스트)", description = "내가 호스트로 받은 예약 목록을 조회합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "401", description = "인증 필요")
    })
    @GetMapping("/host/me")
    public ResponseEntity<ApiResponseDTO<List<BookingResponseDTO>>> getMyBookingsAsHost(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        List<BookingResponseDTO> responses = bookingService.getBookingsByHostId(member.getId());
        return ResponseEntity.ok(ApiResponseDTO.success(responses));
    }

    @Operation(summary = "예약 일정 수정", description = "호스트가 예약의 일정(날짜, 타임슬롯)을 수정합니다. 호스트만 수정 가능합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "수정 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청 (입력값 검증 실패)"),
        @ApiResponse(responseCode = "401", description = "인증 필요"),
        @ApiResponse(responseCode = "403", description = "접근 권한 없음 (호스트만 수정 가능)"),
        @ApiResponse(responseCode = "404", description = "예약 또는 타임슬롯을 찾을 수 없음"),
        @ApiResponse(responseCode = "409", description = "이미 예약된 시간대"),
        @ApiResponse(responseCode = "422", description = "비즈니스 규칙 위반 (과거 날짜, 요일 불가)")
    })
    @PatchMapping("/{bookingId}/schedule")
    public ResponseEntity<ApiResponseDTO<BookingResponseDTO>> updateBookingSchedule(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long bookingId,
            @Valid @RequestBody BookingScheduleUpdateRequestDTO request
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        BookingResponseDTO response = bookingService.updateBookingSchedule(bookingId, member.getId(), request);
        return ResponseEntity.ok(ApiResponseDTO.success(response));
    }

    @Operation(summary = "예약 상태 변경", description = "호스트가 예약의 출석 상태(ATTENDED, NO_SHOW, LATE)를 변경합니다. 호스트만 변경 가능합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "상태 변경 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청 (입력값 검증 실패)"),
        @ApiResponse(responseCode = "401", description = "인증 필요"),
        @ApiResponse(responseCode = "403", description = "접근 권한 없음 (호스트만 변경 가능)"),
        @ApiResponse(responseCode = "404", description = "예약을 찾을 수 없음"),
        @ApiResponse(responseCode = "422", description = "비즈니스 규칙 위반 (상태 변경 불가, 유효하지 않은 상태)")
    })
    @PatchMapping("/{bookingId}/status")
    public ResponseEntity<ApiResponseDTO<BookingResponseDTO>> updateBookingStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long bookingId,
            @Valid @RequestBody BookingStatusUpdateRequestDTO request
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        BookingResponseDTO response = bookingService.updateBookingStatus(bookingId, member.getId(), request);
        return ResponseEntity.ok(ApiResponseDTO.success(response));
    }

    @Operation(summary = "예약 취소", description = "게스트가 본인의 예약을 취소합니다. 게스트만 취소 가능합니다. 당일 취소 시 SAME_DAY_CANCEL, 사전 취소 시 CANCELLED 상태로 변경됩니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "취소 성공"),
        @ApiResponse(responseCode = "401", description = "인증 필요"),
        @ApiResponse(responseCode = "403", description = "접근 권한 없음 (게스트만 취소 가능)"),
        @ApiResponse(responseCode = "404", description = "예약을 찾을 수 없음"),
        @ApiResponse(responseCode = "422", description = "비즈니스 규칙 위반 (취소 불가능한 상태)")
    })
    @DeleteMapping("/{bookingId}")
    public ResponseEntity<Void> cancelBooking(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long bookingId
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        bookingService.cancelBooking(bookingId, member.getId());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "예약 수정 (게스트)", description = "게스트가 본인의 예약 정보(주제, 설명, 일정)를 수정합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "예약 수정 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청 (입력값 검증 실패)"),
        @ApiResponse(responseCode = "401", description = "인증 필요"),
        @ApiResponse(responseCode = "403", description = "접근 권한 없음 (게스트만 수정 가능)"),
        @ApiResponse(responseCode = "404", description = "예약 또는 타임슬롯을 찾을 수 없음"),
        @ApiResponse(responseCode = "409", description = "중복 예약"),
        @ApiResponse(responseCode = "422", description = "비즈니스 규칙 위반 (과거 날짜, 요일 불가)")
    })
    @PatchMapping("/{bookingId}")
    public ResponseEntity<ApiResponseDTO<BookingResponseDTO>> updateBooking(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long bookingId,
            @Valid @RequestBody BookingUpdateRequestDTO request
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        BookingResponseDTO response = bookingService.updateBooking(bookingId, member.getId(), request);
        return ResponseEntity.ok(ApiResponseDTO.success(response));
    }
}

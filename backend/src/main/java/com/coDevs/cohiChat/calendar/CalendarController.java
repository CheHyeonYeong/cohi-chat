package com.coDevs.cohiChat.calendar;

import java.io.OutputStream;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import com.coDevs.cohiChat.booking.response.BookingPublicResponseDTO;
import com.coDevs.cohiChat.calendar.request.CalendarCreateRequestDTO;
import com.coDevs.cohiChat.calendar.request.CalendarUpdateRequestDTO;
import com.coDevs.cohiChat.calendar.response.CalendarPublicResponseDTO;
import com.coDevs.cohiChat.calendar.response.CalendarResponseDTO;
import com.coDevs.cohiChat.global.response.ApiResponseDTO;
import com.coDevs.cohiChat.member.MemberService;
import com.coDevs.cohiChat.member.entity.Member;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;

@RestController
@RequestMapping("/calendar")
@RequiredArgsConstructor
@Validated
public class CalendarController {

    private final CalendarService calendarService;
    private final MemberService memberService;
    private final ObjectMapper objectMapper;

    @PostMapping("/v1")
    public ResponseEntity<ApiResponseDTO<CalendarResponseDTO>> createCalendar(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CalendarCreateRequestDTO request
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        CalendarResponseDTO response = calendarService.createCalendar(member, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponseDTO.success(response));
    }

    @GetMapping("/v1")
    public ResponseEntity<ApiResponseDTO<CalendarResponseDTO>> getCalendar(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        CalendarResponseDTO response = calendarService.getCalendar(member);
        return ResponseEntity.ok(ApiResponseDTO.success(response));
    }

    @PutMapping("/v1")
    public ResponseEntity<ApiResponseDTO<CalendarResponseDTO>> updateCalendar(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CalendarUpdateRequestDTO request
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        CalendarResponseDTO response = calendarService.updateCalendar(member, request);
        return ResponseEntity.ok(ApiResponseDTO.success(response));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<CalendarPublicResponseDTO> getCalendarBySlug(
            @PathVariable @Pattern(regexp = "^[a-zA-Z0-9_-]{1,50}$", message = "유효하지 않은 slug 형식입니다.") String slug
    ) {
        CalendarPublicResponseDTO response = calendarService.getCalendarBySlugPublic(slug);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{slug}/bookings")
    public ResponseEntity<List<BookingPublicResponseDTO>> getBookingsBySlug(
            @PathVariable @Pattern(regexp = "^[a-zA-Z0-9_-]{1,50}$", message = "유효하지 않은 slug 형식입니다.") String slug,
            @RequestParam @Min(1900) @Max(2100) int year,
            @RequestParam @Min(1) @Max(12) int month
    ) {
        List<BookingPublicResponseDTO> response = calendarService.getBookingsBySlug(slug, year, month);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{slug}/bookings/stream")
    public ResponseEntity<StreamingResponseBody> getBookingsStream(
            @PathVariable @Pattern(regexp = "^[a-zA-Z0-9_-]{1,50}$", message = "유효하지 않은 slug 형식입니다.") String slug,
            @RequestParam @Min(1900) @Max(2100) int year,
            @RequestParam @Min(1) @Max(12) int month
    ) {
        List<BookingPublicResponseDTO> bookings = calendarService.getBookingsBySlug(slug, year, month);

        StreamingResponseBody stream = (OutputStream outputStream) -> {
            for (BookingPublicResponseDTO booking : bookings) {
                byte[] json = objectMapper.writeValueAsBytes(booking);
                outputStream.write(json);
                outputStream.write('\n');
                outputStream.flush();
            }
        };

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("application/x-ndjson"))
            .body(stream);
    }
}

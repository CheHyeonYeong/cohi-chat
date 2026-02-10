package com.coDevs.cohiChat.host;

import java.security.Principal;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.calendar.CalendarService;
import com.coDevs.cohiChat.calendar.request.CalendarCreateRequestDTO;
import com.coDevs.cohiChat.calendar.response.CalendarResponseDTO;
import com.coDevs.cohiChat.global.response.ApiResponseDTO;
import com.coDevs.cohiChat.host.request.HostUpdateRequestDTO;
import com.coDevs.cohiChat.host.response.HostProfileResponseDTO;
import com.coDevs.cohiChat.member.MemberService;
import com.coDevs.cohiChat.member.entity.Member;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/hosts")
@RequiredArgsConstructor
public class HostController {

	private final HostService hostService;
	private final CalendarService calendarService;
	private final MemberService memberService;

	@PostMapping("/v1/register")
	@PreAuthorize("isAuthenticated()")
	public ResponseEntity<ApiResponseDTO<HostProfileResponseDTO>> register(Principal principal) {
		HostProfileResponseDTO response = hostService.registerAsHost(principal.getName());
		return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponseDTO.success(response));
	}

	@GetMapping("/v1/me")
	@PreAuthorize("isAuthenticated()")
	public ResponseEntity<ApiResponseDTO<HostProfileResponseDTO>> getProfile(Principal principal) {
		HostProfileResponseDTO response = hostService.getHostProfile(principal.getName());
		return ResponseEntity.ok(ApiResponseDTO.success(response));
	}

	@PutMapping("/v1/me")
	@PreAuthorize("isAuthenticated()")
	public ResponseEntity<ApiResponseDTO<HostProfileResponseDTO>> updateProfile(
		Principal principal,
		@Valid @RequestBody HostUpdateRequestDTO request
	) {
		HostProfileResponseDTO response = hostService.updateHostProfile(principal.getName(), request.getDisplayName());
		return ResponseEntity.ok(ApiResponseDTO.success(response));
	}

	@PostMapping("/v1/me/calendar/connect")
	@PreAuthorize("isAuthenticated()")
	public ResponseEntity<ApiResponseDTO<CalendarResponseDTO>> connectCalendar(
		Principal principal,
		@Valid @RequestBody CalendarCreateRequestDTO request
	) {
		Member member = memberService.getMember(principal.getName());
		CalendarResponseDTO response = calendarService.createCalendar(member, request);
		return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponseDTO.success(response));
	}
}

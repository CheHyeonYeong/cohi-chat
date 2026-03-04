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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "Host", description = "호스트 관리 API")
@RestController
@RequestMapping("/hosts")
@RequiredArgsConstructor
public class HostController {

	private final HostService hostService;
	private final CalendarService calendarService;
	private final MemberService memberService;

	@Operation(summary = "호스트 등록", description = "인증된 회원을 호스트로 등록합니다. 호스트로 등록하면 타임슬롯을 생성하고 커피챗 예약을 받을 수 있습니다.")
	@ApiResponses({
		@ApiResponse(responseCode = "201", description = "호스트 등록 성공"),
		@ApiResponse(responseCode = "401", description = "인증 필요"),
		@ApiResponse(responseCode = "403", description = "권한 없음 (GUEST만 등록 가능)"),
		@ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음"),
		@ApiResponse(responseCode = "409", description = "이미 호스트로 등록됨")
	})
	@PostMapping("/v1/register")
	// hasRole('GUEST') 대신 isAuthenticated() 유지:
	// promoteToHost()에서 이미 HOST인 경우 409(ALREADY_HOST)를 반환해야 하므로
	// 역할 검증은 도메인 레이어에 위임한다.
	@PreAuthorize("isAuthenticated()")
	public ResponseEntity<ApiResponseDTO<HostProfileResponseDTO>> register(Principal principal) {
		HostProfileResponseDTO response = hostService.registerAsHost(principal.getName());
		return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponseDTO.success(response));
	}

	@Operation(summary = "호스트 프로필 조회", description = "인증된 호스트의 프로필 정보를 조회합니다. 캘린더 연결 상태도 함께 반환됩니다.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "프로필 조회 성공"),
		@ApiResponse(responseCode = "401", description = "인증 필요"),
		@ApiResponse(responseCode = "403", description = "호스트 권한 필요"),
		@ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음")
	})
	@GetMapping("/v1/me")
	@PreAuthorize("isAuthenticated()")
	public ResponseEntity<ApiResponseDTO<HostProfileResponseDTO>> getProfile(Principal principal) {
		HostProfileResponseDTO response = hostService.getHostProfile(principal.getName());
		return ResponseEntity.ok(ApiResponseDTO.success(response));
	}

	@Operation(summary = "호스트 프로필 수정", description = "호스트의 닉네임 정보를 수정합니다.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "프로필 수정 성공"),
		@ApiResponse(responseCode = "400", description = "잘못된 요청 (입력값 검증 실패)"),
		@ApiResponse(responseCode = "401", description = "인증 필요"),
		@ApiResponse(responseCode = "403", description = "호스트 권한 필요"),
		@ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음")
	})
	@PutMapping("/v1/me")
	@PreAuthorize("isAuthenticated()")
	public ResponseEntity<ApiResponseDTO<HostProfileResponseDTO>> updateProfile(
		Principal principal,
		@Valid @RequestBody HostUpdateRequestDTO request
	) {
		HostProfileResponseDTO response = hostService.updateHostProfile(principal.getName(), request.getDisplayName());
		return ResponseEntity.ok(ApiResponseDTO.success(response));
	}

	@Operation(summary = "캘린더 연결", description = "호스트의 Google Calendar를 연결합니다. 주제, 설명, Google Calendar ID를 입력하여 커피챗 예약을 받을 캘린더를 설정합니다. 게스트 권한인 경우 자동으로 호스트로 승격됩니다.")
	@ApiResponses({
		@ApiResponse(responseCode = "201", description = "캘린더 연결 성공"),
		@ApiResponse(responseCode = "400", description = "잘못된 요청 (입력값 검증 실패)"),
		@ApiResponse(responseCode = "401", description = "인증 필요"),
		@ApiResponse(responseCode = "403", description = "호스트 권한 필요 (게스트는 자동 승격)"),
		@ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음"),
		@ApiResponse(responseCode = "409", description = "이미 캘린더가 연결됨"),
		@ApiResponse(responseCode = "503", description = "Google Calendar 서비스 불가")
	})
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

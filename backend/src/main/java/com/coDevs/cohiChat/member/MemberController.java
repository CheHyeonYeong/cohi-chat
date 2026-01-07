package com.coDevs.cohiChat.member;

import java.security.Principal;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.global.response.ApiResponse;
import com.coDevs.cohiChat.member.request.CreateMemberRequestDTO;
import com.coDevs.cohiChat.member.response.CreateMemberResponseDTO;
import com.coDevs.cohiChat.member.response.MemberResponseDTO;
import com.coDevs.cohiChat.member.request.UpdateMemberRequestDTO;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import lombok.RequiredArgsConstructor;

/**
 * 회원 관련 API 요청을 처리하는 컨트롤러.
 */
@Tag(name = "Member", description = "회원 가입 및 계정 관리 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/members")
public class MemberController {

	private final MemberService memberService;

	/**
	 * 신규 회원가입을 처리한다.
	 */
	@Operation(summary = "회원가입", description = "아이디와 이메일 중복 확인 후 새로운 회원을 등록합니다.")
	@ApiResponses({
		@io.swagger.v3.oas.annotations.responses.ApiResponse(
			responseCode = "201",
			description = "가입 성공"
		),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(
			responseCode = "400",
			description = "비밀번호 불일치 혹은 유효하지 않은 입력"
		),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(
			responseCode = "409",
			description = "아이디 또는 이메일 중복"
		)
	})
	@PostMapping("/signup")
	public ResponseEntity<ApiResponse<CreateMemberResponseDTO>> signup(
		@RequestBody CreateMemberRequestDTO request
	) {
		CreateMemberResponseDTO response = memberService.signUp(request);

		return ResponseEntity
			.status(HttpStatus.CREATED)
			.body(ApiResponse.success(response));
	}

	/**
	 * 현재 로그인한 사용자의 정보를 조회한다.
	 */
	@Operation(summary = "내 정보 조회", description = "현재 로그인한 사용자의 프로필을 조회합니다.")
	@io.swagger.v3.oas.annotations.responses.ApiResponse(
		responseCode = "200",
		description = "조회 성공"
	)
	@GetMapping("/@me")
	public ResponseEntity<ApiResponse<MemberResponseDTO>> getMe(
		Principal principal
	) {
		MemberResponseDTO response =
			memberService.getByUsername(principal.getName());

		return ResponseEntity.ok(ApiResponse.success(response));
	}

	/**
	 * 현재 로그인한 사용자의 정보를 수정한다.
	 */
	@Operation(summary = "내 정보 수정", description = "별명이나 비밀번호 등 본인의 계정 정보를 수정합니다.")
	@io.swagger.v3.oas.annotations.responses.ApiResponse(
		responseCode = "200",
		description = "수정 성공"
	)
	@PatchMapping("/@me")
	public ResponseEntity<ApiResponse<MemberResponseDTO>> updateMe(
		Principal principal,
		@RequestBody UpdateMemberRequestDTO request
	) {
		MemberResponseDTO response =
			memberService.updateMember(principal.getName(), request);

		return ResponseEntity.ok(ApiResponse.success(response));
	}

	/**
	 * 현재 로그인한 사용자의 계정을 삭제(탈퇴)한다.
	 */
	@Operation(summary = "회원 탈퇴", description = "현재 로그인한 사용자의 계정을 삭제합니다.")
	@io.swagger.v3.oas.annotations.responses.ApiResponse(
		responseCode = "204",
		description = "탈퇴 성공"
	)
	@DeleteMapping("/@me")
	public ResponseEntity<Void> deleteMe(
		Principal principal
	) {
		memberService.deleteMe(principal.getName());
		return ResponseEntity.noContent().build();
	}
}

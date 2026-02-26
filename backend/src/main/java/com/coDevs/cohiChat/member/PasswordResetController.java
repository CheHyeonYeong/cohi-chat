package com.coDevs.cohiChat.member;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.global.response.ApiResponseDTO;
import com.coDevs.cohiChat.member.request.PasswordResetConfirmDTO;
import com.coDevs.cohiChat.member.request.PasswordResetRequestDTO;
import com.coDevs.cohiChat.member.request.PasswordResetVerifyDTO;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "비밀번호 재설정", description = "비밀번호 재설정 관련 API")
@RestController
@RequestMapping("/auth/password-reset")
@RequiredArgsConstructor
public class PasswordResetController {

	private final PasswordResetService passwordResetService;

	@Operation(summary = "비밀번호 재설정 이메일 발송", description = "입력한 이메일로 비밀번호 재설정 링크를 전송합니다. 이메일 미존재 여부를 노출하지 않습니다.")
	@PostMapping("/request")
	public ResponseEntity<ApiResponseDTO<Void>> requestPasswordReset(
		@Valid @RequestBody PasswordResetRequestDTO request) {

		passwordResetService.requestPasswordReset(request.getEmail());
		return ResponseEntity.ok(ApiResponseDTO.success(null));
	}

	@Operation(summary = "재설정 토큰 유효성 검증", description = "이메일로 받은 토큰의 유효성을 확인합니다.")
	@PostMapping("/verify")
	public ResponseEntity<ApiResponseDTO<Void>> verifyResetToken(
		@Valid @RequestBody PasswordResetVerifyDTO request) {

		passwordResetService.verifyResetToken(request.getToken());
		return ResponseEntity.ok(ApiResponseDTO.success(null));
	}

	@Operation(summary = "새 비밀번호 설정", description = "유효한 토큰으로 새 비밀번호를 설정합니다.")
	@PostMapping("/confirm")
	public ResponseEntity<ApiResponseDTO<Void>> confirmPasswordReset(
		@Valid @RequestBody PasswordResetConfirmDTO request) {

		passwordResetService.confirmPasswordReset(request.getToken(), request.getNewPassword());
		return ResponseEntity.ok(ApiResponseDTO.success(null));
	}
}

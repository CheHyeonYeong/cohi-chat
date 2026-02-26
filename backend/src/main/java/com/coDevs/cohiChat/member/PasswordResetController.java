package com.coDevs.cohiChat.member;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.global.response.ApiResponseDTO;
import com.coDevs.cohiChat.member.request.PasswordResetConfirmDTO;
import com.coDevs.cohiChat.member.request.PasswordResetRequestDTO;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/auth/password-reset")
@RequiredArgsConstructor
public class PasswordResetController {

	private final PasswordResetService passwordResetService;

	@PostMapping("/request")
	public ResponseEntity<ApiResponseDTO<Void>> requestPasswordReset(
		@Valid @RequestBody PasswordResetRequestDTO request) {

		passwordResetService.requestPasswordReset(request.getEmail());
		return ResponseEntity.ok(ApiResponseDTO.success(null));
	}

	@GetMapping("/verify")
	public ResponseEntity<ApiResponseDTO<Void>> verifyResetToken(
		@RequestParam String token) {

		passwordResetService.verifyResetToken(token);
		return ResponseEntity.ok(ApiResponseDTO.success(null));
	}

	@PostMapping("/confirm")
	public ResponseEntity<ApiResponseDTO<Void>> confirmPasswordReset(
		@Valid @RequestBody PasswordResetConfirmDTO request) {

		passwordResetService.confirmPasswordReset(request.getToken(), request.getNewPassword());
		return ResponseEntity.ok(ApiResponseDTO.success(null));
	}
}

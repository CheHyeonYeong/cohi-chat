package com.coDevs.cohiChat.member;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.member.request.PasswordResetConfirmDTO;
import com.coDevs.cohiChat.member.request.PasswordResetRequestDTO;
import com.coDevs.cohiChat.member.response.PasswordResetResponseDTO;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/members/v1/password-reset")
@RequiredArgsConstructor
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    @PostMapping("/request")
    public ResponseEntity<PasswordResetResponseDTO> requestPasswordReset(
            @Valid @RequestBody PasswordResetRequestDTO request) {

        passwordResetService.requestPasswordReset(request.getEmail());
        return ResponseEntity.ok(PasswordResetResponseDTO.requestSent());
    }

    @PostMapping("/confirm")
    public ResponseEntity<PasswordResetResponseDTO> confirmPasswordReset(
            @Valid @RequestBody PasswordResetConfirmDTO request) {

        passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(PasswordResetResponseDTO.resetSuccess());
    }
}

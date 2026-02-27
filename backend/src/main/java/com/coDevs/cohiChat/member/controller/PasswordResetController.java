package com.coDevs.cohiChat.member.controller;

import com.coDevs.cohiChat.member.request.PasswordResetConfirmDTO;
import com.coDevs.cohiChat.member.request.PasswordResetRequestDTO;
import com.coDevs.cohiChat.member.service.PasswordResetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "Password Reset", description = "비밀번호 재설정 API")
@RestController
@RequestMapping("/auth/password-reset")
@RequiredArgsConstructor
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    @Operation(summary = "비밀번호 재설정 요청", description = "이메일로 비밀번호 재설정 링크 발송")
    @PostMapping("/request")
    public ResponseEntity<Map<String, String>> requestReset(@Valid @RequestBody PasswordResetRequestDTO dto) {
        passwordResetService.requestPasswordReset(dto.getEmail());
        return ResponseEntity.ok(Map.of("message", "비밀번호 재설정 이메일이 발송되었습니다."));
    }

    @Operation(summary = "토큰 유효성 검증", description = "비밀번호 재설정 토큰 유효성 확인")
    @GetMapping("/verify")
    public ResponseEntity<Map<String, Boolean>> verifyToken(@RequestParam String token) {
        boolean valid = passwordResetService.verifyToken(token);
        return ResponseEntity.ok(Map.of("valid", valid));
    }

    @Operation(summary = "비밀번호 재설정 확인", description = "새 비밀번호로 재설정")
    @PostMapping("/confirm")
    public ResponseEntity<Map<String, String>> confirmReset(@Valid @RequestBody PasswordResetConfirmDTO dto) {
        passwordResetService.resetPassword(dto.getToken(), dto.getPassword());
        return ResponseEntity.ok(Map.of("message", "비밀번호가 성공적으로 재설정되었습니다."));
    }
}

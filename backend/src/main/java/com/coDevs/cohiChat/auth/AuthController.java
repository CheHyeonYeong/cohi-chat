package com.coDevs.cohiChat.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.auth.request.LoginLocalRequestDTO;
import com.coDevs.cohiChat.auth.request.SignupLocalRequestDTO;
import com.coDevs.cohiChat.auth.response.LoginResponseDTO;
import com.coDevs.cohiChat.auth.response.SignupResponseDTO;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "인증(Auth)", description = "회원가입, 로그인 및 토큰 관리 API")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

	private final AuthService authService;

	@Operation(summary = "로컬 회원가입", description = "아이디, 이메일, 비밀번호를 입력받아 새로운 회원을 등록합니다.")
	@ApiResponses(value = {
		@ApiResponse(responseCode = "201", description = "회원가입 성공"),
		@ApiResponse(responseCode = "400", description = "잘못된 입력 값 (유효성 검증 실패)"),
		@ApiResponse(responseCode = "409", description = "이미 존재하는 아이디 또는 이메일")
	})
	@PostMapping("/signup")
	public ResponseEntity<SignupResponseDTO> signupLocal(
		@Valid @RequestBody SignupLocalRequestDTO request) {

		SignupResponseDTO response = authService.signupLocal(request);

		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@Operation(summary = "로컬 로그인", description = "사용자 아이디와 비밀번호를 확인하여 JWT 액세스 토큰을 발급합니다.")
	@ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "로그인 성공"),
		@ApiResponse(responseCode = "401", description = "비밀번호 불일치"),
		@ApiResponse(responseCode = "404", description = "존재하지 않는 사용자")
	})
	@PostMapping("/login")
	public ResponseEntity<LoginResponseDTO> login(
		@Valid @RequestBody LoginLocalRequestDTO request) {

		LoginResponseDTO response = authService.login(request);
		return ResponseEntity.ok(response);
	}
}
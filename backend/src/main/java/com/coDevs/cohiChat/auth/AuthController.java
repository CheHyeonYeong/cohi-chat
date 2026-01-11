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

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

	private final AuthService authService;

	@PostMapping("/signup")
	public ResponseEntity<SignupResponseDTO> signupLocal(
		@Valid @RequestBody SignupLocalRequestDTO request) {

		SignupResponseDTO response = authService.signupLocal(request);

		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@PostMapping("/login")
	public ResponseEntity<LoginResponseDTO> login(
		@Valid @RequestBody LoginLocalRequestDTO request) {

		LoginResponseDTO response = authService.login(request);
		return ResponseEntity.ok(response);
	}
}
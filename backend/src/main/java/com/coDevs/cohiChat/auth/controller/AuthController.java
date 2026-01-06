/*
package com.coDevs.cohiChat.auth.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.auth.dto.LoginRequest;
import com.coDevs.cohiChat.auth.dto.LoginResponse;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {

	private final AuthService authService;

	@PostMapping("/login")
	public ResponseEntity<LoginResponse> login(
		@RequestBody LoginRequest request,
		HttpServletResponse response
	) {
		throw new UnsupportedOperationException("구현 예정");
	}

	@DeleteMapping("/logout")
	public ResponseEntity<Void> logout(HttpServletResponse response) {
		throw new UnsupportedOperationException("구현 예정");
	}
}
*/

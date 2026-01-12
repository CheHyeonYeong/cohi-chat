package com.coDevs.cohiChat.member;


import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.member.request.SignupLocalRequestDTO;
import com.coDevs.cohiChat.member.response.SignupResponseDTO;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/members")
@RequiredArgsConstructor
public class MemberController {

	private final MemberService memberService;

	@PostMapping("/signup")
	public ResponseEntity<SignupResponseDTO> signupLocal(
		@Valid @RequestBody SignupLocalRequestDTO request) {

		SignupResponseDTO response = memberService.signupLocal(request);

		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

}
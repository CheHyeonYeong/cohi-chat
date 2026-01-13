package com.coDevs.cohiChat.member;


import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.member.request.SignupLocalRequestDTO;
import com.coDevs.cohiChat.member.response.SignupResponseDTO;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/member")
@RequiredArgsConstructor
public class MemberController {

	private final MemberService memberService;

	@PostMapping("/v1/signup")
	public ResponseEntity<SignupResponseDTO> signupLocal(
		@Valid @RequestBody SignupLocalRequestDTO request) {

		SignupResponseDTO response = memberService.signupLocal(request);

		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

}
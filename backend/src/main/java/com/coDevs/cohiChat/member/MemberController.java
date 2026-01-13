package com.coDevs.cohiChat.member;


import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.member.request.LoginRequestDTO;
import com.coDevs.cohiChat.member.request.SignupRequestDTO;
import com.coDevs.cohiChat.member.response.LoginResponseDTO;
import com.coDevs.cohiChat.member.response.SignupResponseDTO;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.response.MemberResponseDTO;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/member")
@RequiredArgsConstructor
public class MemberController {

	private final MemberService memberService;
	private final MemberRepository memberRepository;

	@PostMapping("/v1/signup")
	public ResponseEntity<SignupResponseDTO> signupLocal(
		@Valid @RequestBody SignupRequestDTO request) {

		SignupResponseDTO response = memberService.signup(request);

		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@PostMapping("/v1/login")
	public ResponseEntity<LoginResponseDTO> login(
		@Valid @RequestBody LoginRequestDTO request) {

		LoginResponseDTO response = memberService.login(request);
		return ResponseEntity.ok(response);
	}

	@GetMapping("/v1/{username}")
	public ResponseEntity<MemberResponseDTO> getMember(@PathVariable(name = "username") String username) {
		Member member = memberService.getMember(username);
		MemberResponseDTO response = MemberResponseDTO.from(member);
		return ResponseEntity.ok(response);
	}


}
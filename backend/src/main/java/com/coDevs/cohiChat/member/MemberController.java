package com.coDevs.cohiChat.member;


import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.member.request.DeleteMemberRequestDTO;
import com.coDevs.cohiChat.member.request.LoginRequestDTO;
import com.coDevs.cohiChat.member.request.SignupRequestDTO;
import com.coDevs.cohiChat.member.request.UpdateMemberRequestDTO;
import com.coDevs.cohiChat.member.response.LoginResponseDTO;
import com.coDevs.cohiChat.member.response.SignupResponseDTO;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.response.MemberResponseDTO;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/members")
@RequiredArgsConstructor
public class MemberController {

	private final MemberService memberService;

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

	@PatchMapping("/v1/{uesrname}")
	@PreAuthorize("#request.username == authentication.name")
	public ResponseEntity<MemberResponseDTO> updateMember(
		@Valid @RequestBody UpdateMemberRequestDTO request) {

		MemberResponseDTO response = memberService.updateMember(request);
		return ResponseEntity.ok(response);
	}

	@DeleteMapping("/v1/{username}")
	@PreAuthorize("#request.username == authentication.name")
	public ResponseEntity<Void> deleteMember(@Valid @RequestBody DeleteMemberRequestDTO request) {
		memberService.deleteMember(request);
		return ResponseEntity.noContent().build();
	}

}
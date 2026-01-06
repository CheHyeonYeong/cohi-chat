package com.coDevs.cohiChat.member.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.member.dto.MemberResponseDTO;
import com.coDevs.cohiChat.member.dto.CreateMemberRequestDTO;
import com.coDevs.cohiChat.member.dto.CreateMemberResponseDTO;
import com.coDevs.cohiChat.member.dto.UpdateMemberRequestDTO;
import com.coDevs.cohiChat.member.service.MemberService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/members")
public class MemberController {

	private final MemberService memberService;

	@PostMapping("/signup")
	public ResponseEntity<CreateMemberResponseDTO> signup(
		@RequestBody CreateMemberRequestDTO request
	) {
		CreateMemberResponseDTO response = memberService.signUp(request);
		return ResponseEntity
			.status(HttpStatus.CREATED)
			.body(response);
	}

	@GetMapping("/@me")
	public ResponseEntity<MemberResponseDTO> getMe(
		@AuthenticationPrincipal String username
	) {
		MemberResponseDTO response = memberService.getByUsername(username);
		return ResponseEntity.ok(response);
	}

	@PatchMapping("/@me")
	public ResponseEntity<MemberResponseDTO> updateMe(
		@AuthenticationPrincipal String username,
		@RequestBody UpdateMemberRequestDTO request
	) {
		MemberResponseDTO response =
			memberService.updateMember(username, request);
		return ResponseEntity.ok(response);
	}

	@DeleteMapping("/@me")
	public ResponseEntity<Void> deleteMe(
		@AuthenticationPrincipal String username
	) {
		memberService.deleteMe(username);
		return ResponseEntity.noContent().build();
	}
}


package com.coDevs.cohiChat.member.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
		throw new UnsupportedOperationException("구현 예정");
	}

	@GetMapping("/@me")
	public ResponseEntity<MemberResponseDTO> getMe(
		@AuthenticationPrincipal String username
	) {
		throw new UnsupportedOperationException("구현 예정");
	}

	@GetMapping("/{username}")
	public ResponseEntity<MemberResponseDTO> getUserDetail(
		@PathVariable String username
	) {
		throw new UnsupportedOperationException("구현 예정");
	}

	@PatchMapping("/@me")
	public ResponseEntity<MemberResponseDTO> updateMe(
		@AuthenticationPrincipal String username,
		@RequestBody UpdateMemberRequestDTO request
	) {
		throw new UnsupportedOperationException("구현 예정");
	}

	@DeleteMapping("/@me")
	public ResponseEntity<Void> unregister(
		@AuthenticationPrincipal String username
	) {
		throw new UnsupportedOperationException("구현 예정");
	}
}


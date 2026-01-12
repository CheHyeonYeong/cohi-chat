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

import com.coDevs.cohiChat.member.request.LoginLocalRequestDTO;
import com.coDevs.cohiChat.member.request.SignupLocalRequestDTO;
import com.coDevs.cohiChat.member.response.LoginResponseDTO;
import com.coDevs.cohiChat.member.response.SignupResponseDTO;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.memberService;
import com.coDevs.cohiChat.member.request.UpdateMemberRequestDTO;
import com.coDevs.cohiChat.member.response.MemberResponseDTO;

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

	@PostMapping("/login")
	public ResponseEntity<LoginResponseDTO> login(
		@Valid @RequestBody LoginLocalRequestDTO request) {

		LoginResponseDTO response = memberService.login(request);
		return ResponseEntity.ok(response);
	}

	@GetMapping("/{username}")
	public ResponseEntity<MemberResponseDTO> getMember(
		@PathVariable(name = "username") String username) {
		Member member = memberService.getMember(username);
		MemberResponseDTO response = MemberResponseDTO.builder()
			.id(member.getId())
			.username(member.getUsername())
			.displayName(member.getDisplayName())
			.email(member.getEmail())
			.role(member.getRole())
			.createdAt(member.getCreatedAt())
			.updatedAt(member.getUpdatedAt())
			.build();

		return ResponseEntity.ok(response);
	}

	@PatchMapping("/{username}")
	public ResponseEntity<MemberResponseDTO> updateMember(
		@PathVariable(name = "username") String username,
		@RequestBody UpdateMemberRequestDTO requestDto) {
		MemberResponseDTO response = memberService.updateMember(username, requestDto);

		return ResponseEntity.ok(response);
	}

	@DeleteMapping("/{username}")
	public ResponseEntity<Void> deleteMember(
		@PathVariable(name = "username") String username) {
		memberService.deleteMember(username);

		return ResponseEntity.noContent()
			.build();
	}
}
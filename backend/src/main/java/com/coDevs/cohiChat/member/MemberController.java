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

import com.coDevs.cohiChat.member.request.LoginRequestDTO;
import com.coDevs.cohiChat.member.request.RefreshTokenRequestDTO;
import com.coDevs.cohiChat.member.request.SignupRequestDTO;
import com.coDevs.cohiChat.member.request.UpdateMemberRequestDTO;
import com.coDevs.cohiChat.member.response.HostResponseDTO;
import com.coDevs.cohiChat.member.response.LoginResponseDTO;
import com.coDevs.cohiChat.member.response.LogoutResponseDTO;
import com.coDevs.cohiChat.member.response.RefreshTokenResponseDTO;
import com.coDevs.cohiChat.member.response.SignupResponseDTO;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.response.MemberResponseDTO;

import java.security.Principal;
import java.util.List;

import jakarta.servlet.http.HttpServletRequest;
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

	@PostMapping("/v1/refresh")
	public ResponseEntity<RefreshTokenResponseDTO> refreshToken(
		@Valid @RequestBody RefreshTokenRequestDTO request) {

		RefreshTokenResponseDTO response = memberService.refreshAccessToken(request.getRefreshToken());
		return ResponseEntity.ok(response);
	}

	@DeleteMapping("/v1/logout")
	@PreAuthorize("isAuthenticated()")
	public ResponseEntity<LogoutResponseDTO> logout(Principal principal, HttpServletRequest request) {
		String accessToken = resolveToken(request);
		memberService.logout(principal.getName(), accessToken);
		return ResponseEntity.ok(LogoutResponseDTO.success());
	}

	private String resolveToken(HttpServletRequest request) {
		String bearerToken = request.getHeader("Authorization");
		if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
			return bearerToken.substring(7);
		}
		return null;
	}

	@GetMapping("/v1/{username}")
	@PreAuthorize("isAuthenticated() and #username == authentication.name")
	public ResponseEntity<MemberResponseDTO> getMember(@PathVariable(name = "username") String username) {
		Member member = memberService.getMember(username);
		MemberResponseDTO response = MemberResponseDTO.from(member);
		return ResponseEntity.ok(response);
	}

	@PatchMapping("/v1/{username}")
	@PreAuthorize("isAuthenticated()")
	public ResponseEntity<MemberResponseDTO> updateMember(
		@PathVariable(name = "username") String username,
		@Valid @RequestBody UpdateMemberRequestDTO request) {

		MemberResponseDTO response = memberService.updateMember(username, request);
		return ResponseEntity.ok(response);
	}

	@DeleteMapping("/v1/{username}")
	@PreAuthorize("isAuthenticated() and #username == authentication.name")
	public ResponseEntity<Void> deleteMember(@PathVariable(name = "username") String username) {
		memberService.deleteMember(username);
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/v1/hosts")
	public ResponseEntity<List<HostResponseDTO>> getHosts() {
		return ResponseEntity.ok(memberService.getActiveHosts());
	}
}

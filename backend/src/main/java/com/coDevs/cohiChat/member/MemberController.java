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

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.global.response.ApiResponseDTO;
import com.coDevs.cohiChat.global.util.TokenUtil;
import com.coDevs.cohiChat.member.request.LoginRequestDTO;
import com.coDevs.cohiChat.member.request.RefreshTokenRequestDTO;
import com.coDevs.cohiChat.member.request.SignupRequestDTO;
import com.coDevs.cohiChat.member.request.UpdateMemberRequestDTO;
import com.coDevs.cohiChat.member.request.UpdateProfileRequestDTO;
import com.coDevs.cohiChat.member.response.HostResponseDTO;
import com.coDevs.cohiChat.member.response.LoginResponseDTO;
import com.coDevs.cohiChat.member.response.LogoutResponseDTO;
import com.coDevs.cohiChat.member.response.RefreshTokenResponseDTO;
import com.coDevs.cohiChat.member.response.SignupResponseDTO;
import com.coDevs.cohiChat.member.response.WithdrawalCheckResponseDTO;
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
	public ResponseEntity<ApiResponseDTO<SignupResponseDTO>> signupLocal(
		@Valid @RequestBody SignupRequestDTO request) {

		SignupResponseDTO response = memberService.signup(request);

		return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponseDTO.success(response));
	}

	@PostMapping("/v1/login")
	public ResponseEntity<ApiResponseDTO<LoginResponseDTO>> login(
		@Valid @RequestBody LoginRequestDTO request) {

		LoginResponseDTO response = memberService.login(request);
		return ResponseEntity.ok(ApiResponseDTO.success(response));
	}

	@PostMapping("/v1/refresh")
	public ResponseEntity<ApiResponseDTO<RefreshTokenResponseDTO>> refreshToken(
		@Valid @RequestBody RefreshTokenRequestDTO request) {

		RefreshTokenResponseDTO response = memberService.refreshAccessToken(request.getRefreshToken());
		return ResponseEntity.ok(ApiResponseDTO.success(response));
	}

	@DeleteMapping("/v1/logout")
	@PreAuthorize("isAuthenticated()")
	public ResponseEntity<ApiResponseDTO<LogoutResponseDTO>> logout(Principal principal, HttpServletRequest request) {
		String accessToken = TokenUtil.resolveToken(request);
		if (accessToken == null) {
			throw new CustomException(ErrorCode.INVALID_TOKEN);
		}
		memberService.logout(principal.getName(), accessToken);
		return ResponseEntity.ok(ApiResponseDTO.success(LogoutResponseDTO.success()));
	}

	@GetMapping("/v1/{username}")
	@PreAuthorize("isAuthenticated() and #username == authentication.name")
	public ResponseEntity<ApiResponseDTO<MemberResponseDTO>> getMember(@PathVariable(name = "username") String username) {
		Member member = memberService.getMember(username);
		MemberResponseDTO response = MemberResponseDTO.from(member);
		return ResponseEntity.ok(ApiResponseDTO.success(response));
	}

	@PatchMapping("/v1/{username}")
	@PreAuthorize("isAuthenticated() and #username == authentication.name")
	public ResponseEntity<ApiResponseDTO<MemberResponseDTO>> updateMember(
		@PathVariable(name = "username") String username,
		@Valid @RequestBody UpdateMemberRequestDTO request) {

		MemberResponseDTO response = memberService.updateMember(username, request);
		return ResponseEntity.ok(ApiResponseDTO.success(response));
	}

	@DeleteMapping("/v1/{username}")
	@PreAuthorize("isAuthenticated() and #username == authentication.name")
	public ResponseEntity<Void> deleteMember(@PathVariable(name = "username") String username) {
		memberService.deleteMember(username);
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/v1/me/withdrawal-check")
	@PreAuthorize("isAuthenticated()")
	public ResponseEntity<ApiResponseDTO<WithdrawalCheckResponseDTO>> checkWithdrawal(Principal principal) {
		WithdrawalCheckResponseDTO response = memberService.checkWithdrawal(principal.getName());
		return ResponseEntity.ok(ApiResponseDTO.success(response));
	}

	@GetMapping("/v1/hosts")
	public ResponseEntity<ApiResponseDTO<List<HostResponseDTO>>> getHosts() {
		return ResponseEntity.ok(ApiResponseDTO.success(memberService.getActiveHosts()));
	}

	@PatchMapping("/v1/me/profile")
	@PreAuthorize("hasRole('HOST')")
	public ResponseEntity<ApiResponseDTO<HostResponseDTO>> updateProfile(
		@Valid @RequestBody UpdateProfileRequestDTO request,
		Principal principal) {
		HostResponseDTO response = memberService.updateProfile(principal.getName(), request);
		return ResponseEntity.ok(ApiResponseDTO.success(response));
	}
}

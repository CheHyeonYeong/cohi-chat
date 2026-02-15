package com.coDevs.cohiChat.oauth;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.member.response.LoginResponseDTO;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/oauth/v1")
@RequiredArgsConstructor
public class OAuthController {

	private final OAuthService oAuthService;

	@GetMapping("/{provider}/authorize")
	public ResponseEntity<Map<String, String>> getAuthorizationUrl(@PathVariable String provider) {
		String url = oAuthService.getAuthorizationUrl(provider);
		return ResponseEntity.ok(Map.of("url", url));
	}

	@PostMapping("/{provider}/callback")
	public ResponseEntity<LoginResponseDTO> socialLoginCallback(
		@PathVariable String provider,
		@RequestBody OAuthCallbackRequest request
	) {
		LoginResponseDTO response = oAuthService.socialLogin(provider, request.code());
		return ResponseEntity.ok(response);
	}

	public record OAuthCallbackRequest(String code) {}
}

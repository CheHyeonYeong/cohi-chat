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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/oauth/v1")
@RequiredArgsConstructor
@Tag(name = "OAuth", description = "OAuth 2.0 소셜 로그인 API")
public class OAuthController {

	private final OAuthService oAuthService;

	@Operation(summary = "OAuth 인가 URL 조회", description = "지정된 provider의 OAuth 인가 URL을 반환합니다")
	@GetMapping("/{provider}/authorize")
	public ResponseEntity<Map<String, String>> getAuthorizationUrl(@PathVariable String provider) {
		String url = oAuthService.getAuthorizationUrl(provider);
		return ResponseEntity.ok(Map.of("url", url));
	}

	@Operation(summary = "OAuth 콜백 처리", description = "인가 코드를 교환하여 JWT를 발급합니다")
	@PostMapping("/{provider}/callback")
	public ResponseEntity<LoginResponseDTO> socialLoginCallback(
		@PathVariable String provider,
		@Valid @RequestBody OAuthCallbackRequest request
	) {
		LoginResponseDTO response = oAuthService.socialLogin(provider, request.code());
		return ResponseEntity.ok(response);
	}

	public record OAuthCallbackRequest(@NotBlank(message = "인가 코드는 필수입니다.") String code) {}
}

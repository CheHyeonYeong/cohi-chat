package com.coDevs.cohiChat.global.security.auth;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.auth")
public class AuthProperties {

	private List<String> corsAllowedOrigins = List.of(
		"http://localhost:3000",
		"http://127.0.0.1:3000",
		"http://localhost:5173",
		"http://127.0.0.1:5173",
		"https://www.cohi-chat.com",
		"https://cohi-chat.com"
	);

	private final Cookie cookie = new Cookie();

	@Getter
	@Setter
	public static class Cookie {
		private String accessTokenName = "cohi_access_token";
		private String refreshTokenName = "cohi_refresh_token";
		private String path = "/api";
		private SameSitePolicy sameSite = SameSitePolicy.Lax;
		private boolean secure = false;
	}

	public enum SameSitePolicy {
		Strict, Lax, None
	}
}

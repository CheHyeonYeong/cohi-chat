package com.coDevs.cohiChat.oauth;

import org.springframework.boot.context.properties.ConfigurationProperties;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "oauth2")
public class OAuthProperties {

	private ProviderConfig google = new ProviderConfig();
	private ProviderConfig kakao = new ProviderConfig();

	@PostConstruct
	public void validate() {
		validateProvider("google", google);
		validateProvider("kakao", kakao);
	}

	private void validateProvider(String name, ProviderConfig config) {
		if (config.getClientId() == null || config.getClientId().isBlank()) {
			throw new IllegalStateException("oauth2." + name + ".client-id is not configured");
		}
		if (config.getClientSecret() == null || config.getClientSecret().isBlank()) {
			throw new IllegalStateException("oauth2." + name + ".client-secret is not configured");
		}
		if (config.getRedirectUri() == null || config.getRedirectUri().isBlank()) {
			throw new IllegalStateException("oauth2." + name + ".redirect-uri is not configured");
		}
	}

	@Getter
	@Setter
	public static class ProviderConfig {
		private String clientId;
		private String clientSecret;
		private String redirectUri;
	}
}

package com.coDevs.cohiChat.oauth;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@ConfigurationProperties(prefix = "oauth2")
public class OAuthProperties {

	private ProviderConfig google = new ProviderConfig();
	private ProviderConfig kakao = new ProviderConfig();

	@Getter
	@Setter
	public static class ProviderConfig {
		private String clientId;
		private String clientSecret;
		private String redirectUri;
	}
}

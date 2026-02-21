package com.coDevs.cohiChat.oauth;

import java.time.Duration;

import org.springframework.boot.web.client.ClientHttpRequestFactorySettings;
import org.springframework.boot.web.client.ClientHttpRequestFactories;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class OAuthConfig {

	@Bean
	public RestClient oauthRestClient() {
		var settings = ClientHttpRequestFactorySettings.DEFAULTS
			.withConnectTimeout(Duration.ofSeconds(5))
			.withReadTimeout(Duration.ofSeconds(10));

		return RestClient.builder()
			.requestFactory(ClientHttpRequestFactories.get(settings))
			.build();
	}
}

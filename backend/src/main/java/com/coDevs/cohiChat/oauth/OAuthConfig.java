package com.coDevs.cohiChat.oauth;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class OAuthConfig {

	@Bean
	public RestClient oauthRestClient() {
		return RestClient.create();
	}
}

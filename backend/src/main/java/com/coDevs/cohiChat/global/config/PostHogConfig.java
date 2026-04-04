package com.coDevs.cohiChat.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.posthog.java.PostHog;

@Configuration
public class PostHogConfig {

    @Value("${posthog.api-key:}")
    private String apiKey;

    @Value("${posthog.host:https://us.i.posthog.com}")
    private String host;

    @Bean
    public PostHog postHog() {
        if (apiKey == null || apiKey.isBlank()) {
            return null;
        }
        return new PostHog.Builder(apiKey).host(host).build();
    }
}

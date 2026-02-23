package com.coDevs.cohiChat.config;

import java.util.HashMap;
import java.util.Map;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueResponse;

public class SecretsManagerEnvironmentPostProcessor implements EnvironmentPostProcessor {

	private static final String SECRET_NAME = "cohi-chat/prod";
	private static final String REGION = "ap-northeast-2";
	private static final String PROPERTY_SOURCE_NAME = "aws-secrets-manager";

	@Override
	public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
		String activeProfile = environment.getProperty("spring.profiles.active", "");

		// prod 프로필일 때만 Secrets Manager에서 로드
		if (!activeProfile.contains("prod")) {
			return;
		}

		try {
			Map<String, Object> secrets = loadSecrets();
			if (!secrets.isEmpty()) {
				environment.getPropertySources()
					.addFirst(new MapPropertySource(PROPERTY_SOURCE_NAME, secrets));
			}
		} catch (Exception e) {
			// 시크릿 로드 실패 시 로그만 남기고 계속 진행 (로컬 개발 환경 대비)
			System.err.println("Failed to load secrets from AWS Secrets Manager: " + e.getMessage());
		}
	}

	private Map<String, Object> loadSecrets() {
		Map<String, Object> properties = new HashMap<>();

		try (SecretsManagerClient client = SecretsManagerClient.builder()
				.region(Region.of(REGION))
				.build()) {

			GetSecretValueRequest request = GetSecretValueRequest.builder()
				.secretId(SECRET_NAME)
				.build();

			GetSecretValueResponse response = client.getSecretValue(request);
			String secretString = response.secretString();

			ObjectMapper mapper = new ObjectMapper();
			Map<String, String> secretMap = mapper.readValue(
				secretString,
				new TypeReference<Map<String, String>>() {}
			);

			// Secrets Manager의 키를 Spring 프로퍼티로 매핑
			secretMap.forEach((key, value) -> {
				// 언더스코어를 점으로 변환하고 소문자로 (JWT_SECRET -> jwt.secret)
				String propertyKey = key.toLowerCase().replace("_", ".");
				properties.put(propertyKey, value);

				// 원본 키도 환경변수 스타일로 유지 (${REDIS_PASSWORD} 같은 참조용)
				properties.put(key, value);
			});
		}

		return properties;
	}
}

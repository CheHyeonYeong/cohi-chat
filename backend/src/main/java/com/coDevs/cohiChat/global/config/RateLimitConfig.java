package com.coDevs.cohiChat.global.config;

import java.time.Duration;

import org.springframework.beans.factory.DisposableBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;

import io.github.bucket4j.distributed.ExpirationAfterWriteStrategy;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.codec.StringCodec;

@Configuration
@EnableConfigurationProperties(RateLimitProperties.class)
public class RateLimitConfig implements DisposableBean {

	private StatefulRedisConnection<String, byte[]> redisConnection;

	@Bean
	public LettuceBasedProxyManager<String> lettuceProxyManager(
		LettuceConnectionFactory connectionFactory, RateLimitProperties properties) {

		Object nativeClient = connectionFactory.getNativeClient();
		if (!(nativeClient instanceof RedisClient redisClient)) {
			throw new IllegalStateException(
				"Standalone RedisClient가 필요합니다. 현재: " + nativeClient.getClass().getName());
		}

		this.redisConnection = redisClient.connect(
			RedisCodec.of(StringCodec.UTF8, ByteArrayCodec.INSTANCE));

		return LettuceBasedProxyManager.builderFor(this.redisConnection)
			.withExpirationStrategy(
				ExpirationAfterWriteStrategy.basedOnTimeForRefillingBucketUpToMax(
					Duration.ofSeconds(properties.getBucketTtlSeconds()))
			)
			.build();
	}

	@Override
	public void destroy() {
		if (redisConnection != null && redisConnection.isOpen()) {
			redisConnection.close();
		}
	}
}

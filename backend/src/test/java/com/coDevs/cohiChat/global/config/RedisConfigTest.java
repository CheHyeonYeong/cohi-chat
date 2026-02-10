package com.coDevs.cohiChat.global.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.RedisPassword;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;

class RedisConfigTest {

    @Test
    @DisplayName("비밀번호가 설정된 경우 RedisStandaloneConfiguration에 비밀번호가 포함된다")
    void connectionFactoryWithPassword() {
        RedisConfig config = new RedisConfig();
        config.setHost("localhost");
        config.setPort(6379);
        config.setPassword("devpassword");

        LettuceConnectionFactory factory = config.redisConnectionFactory();
        RedisStandaloneConfiguration standaloneConfig = factory.getStandaloneConfiguration();

        assertThat(standaloneConfig.getHostName()).isEqualTo("localhost");
        assertThat(standaloneConfig.getPort()).isEqualTo(6379);
        assertThat(standaloneConfig.getPassword()).isEqualTo(RedisPassword.of("devpassword"));
    }

    @Test
    @DisplayName("비밀번호가 빈 문자열이면 인증 없이 연결한다")
    void connectionFactoryWithEmptyPassword() {
        RedisConfig config = new RedisConfig();
        config.setHost("localhost");
        config.setPort(6379);
        config.setPassword("");

        LettuceConnectionFactory factory = config.redisConnectionFactory();
        RedisStandaloneConfiguration standaloneConfig = factory.getStandaloneConfiguration();

        assertThat(standaloneConfig.getPassword()).isEqualTo(RedisPassword.none());
    }

    @Test
    @DisplayName("비밀번호가 null이면 인증 없이 연결한다")
    void connectionFactoryWithNullPassword() {
        RedisConfig config = new RedisConfig();
        config.setHost("localhost");
        config.setPort(6379);
        config.setPassword(null);

        LettuceConnectionFactory factory = config.redisConnectionFactory();
        RedisStandaloneConfiguration standaloneConfig = factory.getStandaloneConfiguration();

        assertThat(standaloneConfig.getPassword()).isEqualTo(RedisPassword.none());
    }

    @Test
    @DisplayName("연결 타임아웃이 설정된다")
    void connectionFactoryHasTimeout() {
        RedisConfig config = new RedisConfig();
        config.setHost("localhost");
        config.setPort(6379);
        config.setPassword("");

        LettuceConnectionFactory factory = config.redisConnectionFactory();
        LettuceClientConfiguration clientConfig = factory.getClientConfiguration();

        assertThat(clientConfig.getCommandTimeout()).isEqualTo(Duration.ofSeconds(3));
    }
}

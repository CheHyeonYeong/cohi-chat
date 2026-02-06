package com.coDevs.cohiChat.config;

import java.io.IOException;
import java.net.ServerSocket;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import redis.embedded.RedisServer;

@TestConfiguration
public class EmbeddedRedisConfig {

    private RedisServer redisServer;
    private int port;

    @PostConstruct
    public void startRedis() throws IOException {
        port = findAvailablePort();
        redisServer = RedisServer.newRedisServer()
            .port(port)
            .setting("maxmemory 128M")
            .build();
        redisServer.start();
    }

    @PreDestroy
    public void stopRedis() throws IOException {
        if (redisServer != null) {
            redisServer.stop();
        }
    }

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration("localhost", port);
        return new LettuceConnectionFactory(config);
    }

    private int findAvailablePort() throws IOException {
        try (ServerSocket socket = new ServerSocket(0)) {
            return socket.getLocalPort();
        }
    }
}

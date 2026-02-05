package com.coDevs.cohiChat.member.entity;

import java.util.concurrent.TimeUnit;

import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.TimeToLive;
import org.springframework.data.redis.core.index.Indexed;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@RedisHash(value = "refreshToken")
public class RefreshToken {

    @Id
    private String username;

    @Indexed
    private String token;

    @TimeToLive(unit = TimeUnit.MILLISECONDS)
    private Long expiration;

    @Builder
    private RefreshToken(String username, String token, Long expiration) {
        this.username = username;
        this.token = token;
        this.expiration = expiration;
    }

    public static RefreshToken create(String token, String username, Long expirationMs) {
        return RefreshToken.builder()
            .username(username)
            .token(token)
            .expiration(expirationMs)
            .build();
    }
}

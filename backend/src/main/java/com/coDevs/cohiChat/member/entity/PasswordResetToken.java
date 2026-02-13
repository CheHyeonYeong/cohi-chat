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
@RedisHash(value = "passwordResetToken")
public class PasswordResetToken {

    @Id
    private String token;

    @Indexed
    private String email;

    @TimeToLive(unit = TimeUnit.MILLISECONDS)
    private Long expiration;

    @Builder
    private PasswordResetToken(String token, String email, Long expiration) {
        this.token = token;
        this.email = email;
        this.expiration = expiration;
    }

    public static PasswordResetToken create(String token, String email, Long expirationMs) {
        return PasswordResetToken.builder()
            .token(token)
            .email(email)
            .expiration(expirationMs)
            .build();
    }
}

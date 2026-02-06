package com.coDevs.cohiChat.member;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.coDevs.cohiChat.member.entity.RefreshToken;

public interface RefreshTokenRepository extends CrudRepository<RefreshToken, String> {

    Optional<RefreshToken> findByToken(String token);
}

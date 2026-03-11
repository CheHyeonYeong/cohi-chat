package com.coDevs.cohiChat.member.repository;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.coDevs.cohiChat.member.entity.PasswordResetToken;

public interface PasswordResetTokenRepository extends CrudRepository<PasswordResetToken, String> {
    Optional<PasswordResetToken> findByEmail(String email);
}

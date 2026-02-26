package com.coDevs.cohiChat.member;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import com.coDevs.cohiChat.member.entity.PasswordResetToken;

public interface PasswordResetTokenRepository extends CrudRepository<PasswordResetToken, String> {

	Optional<PasswordResetToken> findByTokenHash(String tokenHash);
}

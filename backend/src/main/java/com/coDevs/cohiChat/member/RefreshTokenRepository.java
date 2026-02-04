package com.coDevs.cohiChat.member;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.coDevs.cohiChat.member.entity.RefreshToken;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    Optional<RefreshToken> findByUsername(String username);

    @Modifying
    @Query("DELETE FROM RefreshToken r WHERE r.username = :username")
    void deleteByUsername(@Param("username") String username);
}

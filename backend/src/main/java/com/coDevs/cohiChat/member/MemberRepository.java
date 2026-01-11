package com.coDevs.cohiChat.member;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.coDevs.cohiChat.member.entity.Member;

public interface MemberRepository extends JpaRepository<Member, UUID> {

	Optional<Member> findByUsername(String username);

	boolean existsByUsername(String username);

	boolean existsByEmail(String email);

}

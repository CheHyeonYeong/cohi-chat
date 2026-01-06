package com.coDevs.cohiChat.member.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.coDevs.cohiChat.member.entity.Member;

public interface MemberRepository extends JpaRepository<Member, Long> {
	// 1. Username으로 조회
	Optional<Member> findByUsername(String username);

	// 2. Username 존재 여부
	boolean existsByUsername(String username);

	// 3. Email 존재 여부
	boolean existsByEmail(String email);

}

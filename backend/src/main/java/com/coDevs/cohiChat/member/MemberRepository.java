package com.coDevs.cohiChat.member;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.coDevs.cohiChat.member.entity.Member;

@Repository
public interface MemberRepository extends JpaRepository<Member, UUID> {

	Optional<Member> findByUsernameAndIsDeleted(String username);

	boolean existsByUsernameAndIsDeleted(String username);

	boolean existsByEmail(String email);


}

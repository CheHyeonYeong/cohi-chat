package com.coDevs.cohiChat.member;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;

@Repository
public interface MemberRepository extends JpaRepository<Member, UUID> {

	Optional<Member> findByUsernameAndIsDeletedFalse(String username);

	boolean existsByUsernameAndIsDeletedFalse(String username);

	boolean existsByEmail(String email);

	Optional<Member> findByIdAndRoleAndIsDeletedFalse(UUID id, Role role);

	java.util.List<Member> findByRoleAndIsDeletedFalse(Role role);

}

package com.coDevs.cohiChat.member;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Provider;
import com.coDevs.cohiChat.member.entity.Role;

import jakarta.persistence.LockModeType;

@Repository
public interface MemberRepository extends JpaRepository<Member, UUID> {

	Optional<Member> findByUsernameAndIsDeletedFalse(String username);

	boolean existsByUsernameAndIsDeletedFalse(String username);

	boolean existsByEmail(String email);

	Optional<Member> findByIdAndRoleAndIsDeletedFalse(UUID id, Role role);

	java.util.List<Member> findByRoleAndIsDeletedFalse(Role role);

	Optional<Member> findByEmailAndProviderAndIsDeletedFalse(String email, Provider provider);

	Optional<Member> findByProviderAndProviderIdAndIsDeletedFalse(Provider provider, String providerId);

	Optional<Member> findByProviderAndProviderId(Provider provider, String providerId);

	Optional<Member> findByEmailAndIsDeletedFalse(String email);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("SELECT m FROM Member m WHERE m.id = :id")
	Optional<Member> findByIdWithLock(@Param("id") UUID id);

	/**
	 * 전체 활성 회원 수 조회
	 */
	@Query("SELECT COUNT(m) FROM Member m WHERE m.isDeleted = false")
	long countActiveMembers();

	/**
	 * 역할별 활성 회원 수 집계 (단일 쿼리)
	 */
	@Query("""
		SELECT m.role AS role, COUNT(m) AS count
		FROM Member m
		WHERE m.isDeleted = false
		GROUP BY m.role
		""")
	java.util.List<RoleCount> countByRole();

	/**
	 * OAuth 제공자별 활성 회원 수 집계 (단일 쿼리)
	 */
	@Query("""
		SELECT m.provider AS provider, COUNT(m) AS count
		FROM Member m
		WHERE m.isDeleted = false
		GROUP BY m.provider
		""")
	java.util.List<ProviderCount> countByProvider();

	interface RoleCount {
		Role getRole();
		long getCount();
	}

	interface ProviderCount {
		Provider getProvider();
		long getCount();
	}

}

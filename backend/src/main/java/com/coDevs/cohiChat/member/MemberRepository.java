package com.coDevs.cohiChat.member;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.coDevs.cohiChat.member.entity.Member;

/**
 * 회원 엔티티에 대한 데이터 액세스를 담당하는 리포지토리.
 * * - 중복 가입 방지를 위한 식별값(아이디, 이메일) 존재 여부를 확인한다.
 * - 인증 및 정보 조회를 위한 계정 조회 기능을 제공한다.
 */
public interface MemberRepository extends JpaRepository<Member, Long> {

	Optional<Member> findByUsername(String username);

	boolean existsByUsername(String username);

	boolean existsByEmail(String email);

}

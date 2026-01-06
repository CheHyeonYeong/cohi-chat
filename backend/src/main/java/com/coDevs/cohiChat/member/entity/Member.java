package com.coDevs.cohiChat.member.entity;

import java.time.LocalDateTime;

import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.EntityListeners;
import jakarta.persistence.Id;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import lombok.Builder;
import lombok.Getter;

/**
 * 서비스의 회원 정보를 관리하는 도메인 엔티티.
 *
 * - 회원의 기본 계정 정보와 권한 상태를 관리한다.
 * - 중복된 이메일과 아이디는 허용하지 않는다.
 */
@Entity
@EntityListeners(AuditingEntityListener.class)
@Getter
public class Member {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(length = 50, nullable = false, updatable = false)
	private String username;

	@Column(name = "display_name", length = 50, nullable = false)
	private String displayName;

	@Column(length = 255, nullable = false)
	private String email;

	@Column(name = "hashed_password", nullable = false)
	private String hashedPassword;

	@Column(name = "is_host", nullable = false)
	private boolean isHost = false;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	protected Member() {
		// JPA 전용
	}

	/**
	 * 신규 회원 엔티티를 생성한다.
	 */
	public static Member create(
		String username,
		String displayName,
		String email,
		String hashedPassword,
		boolean isHost
	) {
		Member member = new Member();
		member.username = username;
		member.displayName = displayName;
		member.email = email;
		member.hashedPassword = hashedPassword;
		member.isHost = isHost;
		return member;
	}

	/**
	 * 표시명을 변경한다.
	 */
	public void updateDisplayName(String displayName) {
		this.displayName = displayName;
	}

	/**
	 * 비밀번호를 변경한다.
	 */
	public void updatePassword(String hashedPassword) {
		this.hashedPassword = hashedPassword;
	}

	/**
	 * 테스트 코드용 생성자로, 실제 Service 계층에선 사용하지 않는다.
	 */
	@Builder
	private Member(
		Long id,
		String username,
		String displayName,
		String email,
		String hashedPassword,
		boolean isHost,
		LocalDateTime createdAt,
		LocalDateTime updatedAt
	) {
		this.id = id;
		this.username = username;
		this.displayName = displayName;
		this.email = email;
		this.hashedPassword = hashedPassword;
		this.isHost = isHost;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
	}

	@PrePersist
	protected void onCreate() {
		this.createdAt = LocalDateTime.now();
		this.updatedAt = this.createdAt;
	}

	@PreUpdate
	protected void onUpdate() {
		this.updatedAt = LocalDateTime.now();
	}
}

package com.coDevs.cohiChat.member.entity;

import java.time.LocalDateTime;
import java.util.UUID;

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

@Entity
@EntityListeners(AuditingEntityListener.class)
@Getter
public class Member {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	@Column(columnDefinition = "BINARY(16)")
	private UUID id;

	@Column(length = 50, nullable = false, updatable = false, unique = true)
	private String username;

	@Column(name = "display_name", length = 50, nullable = false)
	private String displayName;

	@Column(length = 255, nullable = false, unique = true)
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

	}

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


	public void updateDisplayName(String displayName) {
		this.displayName = displayName;
	}

	public void updatePassword(String hashedPassword) {
		this.hashedPassword = hashedPassword;
	}


	@Builder
	private Member(
		UUID id,
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

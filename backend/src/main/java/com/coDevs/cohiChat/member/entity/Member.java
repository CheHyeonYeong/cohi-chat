package com.coDevs.cohiChat.member.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
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

	@Enumerated(EnumType.STRING)
	@Column(name = "role", nullable = false, length = 20)
	private Role role;

	@CreatedDate
	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@LastModifiedDate
	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	public static Member create(
		String username,
		String displayName,
		String email,
		String hashedPassword,
		Role role
	) {

		Member member = new Member();
		member.username = username;
		member.displayName = displayName;
		member.email = email;
		member.hashedPassword = hashedPassword;
		member.role = role;
		return member;
	}

	public void updateInfo(String displayName, String hashedPassword) {
		if (displayName != null && !displayName.isBlank()) {
			this.updateDisplayName(displayName);
		}
		if (hashedPassword != null && !hashedPassword.isBlank()) {
			this.updatePassword(hashedPassword);
		}
	}

	public void updateDisplayName(String displayName) {
		this.displayName = displayName;
	}

	public void updatePassword(String hashedPassword) {
		this.hashedPassword = hashedPassword;
	}

}

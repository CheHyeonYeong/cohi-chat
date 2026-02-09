package com.coDevs.cohiChat.member.entity;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;

import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "member", indexes = {
	@Index(name = "idx_member_email", columnList = "email"),
	@Index(name = "idx_member_username", columnList = "username")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	@Column(columnDefinition = "BINARY(16)")
	private UUID id;

	/**
	 *  사용자 로그인 아이디.
	 */

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
	@Column(name = "created_at", updatable = false)
	private Instant createdAt;

	@LastModifiedDate
	@Column(name = "updated_at", updatable = true)
	private Instant updatedAt;

	@Column(name = "is_deleted", nullable = false)
	private boolean isDeleted = false;

	@Column(name = "deleted_at")
	private Instant deletedAt;

	public static Member create(

		String username,
		String displayName,
		String email,
		String hashedPassword,
		Role role
	) {
		validateRequired(username, displayName, email, hashedPassword, role);

		Member member = new Member();
		member.username = username;
		member.displayName = displayName;
		member.email = email;
		member.hashedPassword = hashedPassword;
		member.role = role;
		member.isDeleted = false;

		return member;
	}

	private static void validateRequired(String username, String displayName, String email, String hashedPassword, Role role) {

		if (username == null || username.isBlank()) throw new CustomException(ErrorCode.INVALID_USERNAME);
		if (displayName == null || displayName.isBlank()) throw new CustomException(ErrorCode.INVALID_DISPLAY_NAME);
		if (email == null || email.isBlank()) throw new CustomException(ErrorCode.INVALID_EMAIL);
		if (hashedPassword == null || hashedPassword.isBlank()) throw new CustomException(ErrorCode.INVALID_PASSWORD);
		if (role == null) throw new CustomException(ErrorCode.INVALID_ROLE);

	}

	public void updateInfo(String displayName, String hashedPassword) {
		if (displayName != null && !displayName.isBlank()) {
			this.displayName = displayName;
		}
		if (hashedPassword != null && !hashedPassword.isBlank()) {
			this.hashedPassword = hashedPassword;
		}
	}

	public void softDelete() {
		this.isDeleted = true;
		this.deletedAt = Instant.now();
	}

	public boolean isActive() {
		return !isDeleted;
	}
}

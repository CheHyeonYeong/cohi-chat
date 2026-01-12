package com.coDevs.cohiChat.member.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import org.apache.commons.text.RandomStringGenerator;
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
		validateRequired(username, email, hashedPassword);

		Member member = new Member();
		member.username = username;
		member.displayName = displayName;
		member.email = email;
		member.hashedPassword = hashedPassword;

		member.displayName = (displayName == null || displayName.isBlank())
			? generateDefaultDisplayName() : displayName;

		member.role = (role != null) ? role : Role.GUEST;

		return member;
	}

	private static void validateRequired(String username, String email, String hashedPassword) {
		if (username == null || username.isBlank()) throw new CustomException(ErrorCode.INVALID_USERNAME);
		if (email == null || email.isBlank()) throw new CustomException(ErrorCode.INVALID_EMAIL); // 필요시 추가
		if (hashedPassword == null || hashedPassword.isBlank()) throw new CustomException(ErrorCode.INVALID_PASSWORD);
	}

	private static String generateDefaultDisplayName() {
		return new RandomStringGenerator.Builder()
			.withinRange('0', 'z')
			.filteredBy(Character::isLetterOrDigit)
			.build()
			.generate(8);
	}

	public void updateInfo(String displayName, String hashedPassword) {
		if (displayName != null && !displayName.isBlank()) {
			this.displayName = displayName;
		}
		if (hashedPassword != null && !hashedPassword.isBlank()) {
			this.hashedPassword = hashedPassword;
		}
	}
}

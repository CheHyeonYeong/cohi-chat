package com.coDevs.cohiChat.member.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Id;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;

@Entity
@Table(
	name = "member",
	uniqueConstraints = {
		@UniqueConstraint(columnNames = "username"),
		@UniqueConstraint(columnNames = "email")
	}
)
@Getter
public class Member {

	/** 사용자 식별자 (내부 식별용, 외부 노출 금지). */
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/**
	 * 로그인에 사용되는 고유 식별자.
	 * 변경이 불가능하며, 시스템 전반에서 사용자의 기준 키 역할을 한다.
	 */
	@Column(length = 50, nullable = false, updatable = false)
	private String username;

	/**
	 * 서비스 내에서 사용자에게 표시되는 이름.
	 * 닉네임 성격으로, 정책에 따라 변경될 수 있다.
	 */
	@Column(name = "display_name", length = 50, nullable = false)
	private String displayName;

	/**
	 * 사용자 이메일.
	 * 알림, 인증, 계정 복구 등에 사용된다.
	 */
	@Column(length = 255, nullable = false)
	private String email;

	/**
	 * 암호화된 비밀번호.
	 *
	 * <p>
	 * 절대 평문 비밀번호를 저장하지 않으며,
	 * 암호화 로직은 도메인 외부(Service 계층)에서 처리한다.
	 * </p>
	 */
	@Column(name = "hashed_password", nullable = false)
	private String hashedPassword;

	/**
	 * 호스트 권한 여부.
	 *
	 * <p>
	 * 단순 역할 플래그로 사용되며,
	 * 실제 권한 판단은 별도의 인가 로직에서 수행한다.
	 * </p>
	 */
	@Column(name = "is_host", nullable = false)
	private boolean isHost = false;

	/** 계정 생성 시각. */
	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	/** 마지막 정보 수정 시각. */
	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	protected Member() {
		// JPA 전용 생성자.
	}

	/**
	 * 신규 사용자 생성.
	 */
	public Member(String username, String displayName, String email, String hashedPassword) {
		this.username = username;
		this.displayName = displayName;
		this.email = email;
		this.hashedPassword = hashedPassword;
	}

	/** 표시 이름 변경. */
	public void updateDisplayName(String displayName) {
		this.displayName = displayName;
	}

	/** 비밀번호 변경 (암호화된 값만 허용). */
	public void updatePassword(String hashedPassword) {
		this.hashedPassword = hashedPassword;
	}

	/** 호스트 권한 부여. */
	public void grantHost() {
		this.isHost = true;
	}

	/** 호스트 권한 회수. */
	public void revokeHost() {
		this.isHost = false;
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

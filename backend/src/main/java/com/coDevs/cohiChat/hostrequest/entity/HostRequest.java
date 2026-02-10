package com.coDevs.cohiChat.hostrequest.entity;

import java.time.Instant;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "host_request")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class HostRequest {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "member_id", nullable = false)
	private Member member;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false, length = 20)
	private HostRequestStatus status;

	@CreatedDate
	@Column(name = "created_at", updatable = false)
	private Instant createdAt;

	@Column(name = "processed_at")
	private Instant processedAt;

	public static HostRequest create(Member member) {
		if (member.getRole() != Role.GUEST) {
			throw new CustomException(ErrorCode.ALREADY_HOST);
		}

		HostRequest request = new HostRequest();
		request.member = member;
		request.status = HostRequestStatus.PENDING;
		return request;
	}

	public void approve() {
		validatePending();
		this.status = HostRequestStatus.APPROVED;
		this.processedAt = Instant.now();
	}

	public void reject() {
		validatePending();
		this.status = HostRequestStatus.REJECTED;
		this.processedAt = Instant.now();
	}

	private void validatePending() {
		if (this.status != HostRequestStatus.PENDING) {
			throw new CustomException(ErrorCode.HOST_REQUEST_ALREADY_PROCESSED);
		}
	}
}

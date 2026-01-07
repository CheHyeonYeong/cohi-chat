package com.coDevs.cohiChat.member.fixture;

import java.time.LocalDateTime;
import java.util.UUID;

import com.coDevs.cohiChat.member.entity.Member;

public class MemberFixture {

	/**
	 * 기본 테스트용 Member
	 * - host 아님
	 * - 고정된 값으로 예측 가능한 테스트
	 */
	public static Member create() {
		return Member.create(
			"test_user",
			"테스트유저",
			"test@email.com",
			"hashed_password",
			false
		);
	}

	/**
	 * Host 계정 테스트용
	 */
	public static Member host() {
		return Member.create(
			"host_user",
			"호스트",
			"host@email.com",
			"hashed_password",
			true
		);
	}

	/**
	 * 커스텀 값이 필요한 테스트용
	 */
	public static Member create(
		String username,
		String displayName,
		String email,
		boolean isHost
	) {
		return Member.create(
			username,
			displayName,
			email,
			"hashed_password",
			isHost
		);
	}

	/**
	 * ID가 필요한 테스트 (JPA 저장 전 시나리오 제외)
	 * ⚠️ JPA save() 테스트에서는 사용하지 말 것
	 */
	public static Member withId(UUID id) {
		return Member.builder()
			.id(id)
			.username("test_user")
			.displayName("테스트유저")
			.email("test@email.com")
			.hashedPassword("hashed_password")
			.isHost(false)
			.createdAt(LocalDateTime.now().minusDays(1))
			.updatedAt(LocalDateTime.now().minusDays(1))
			.build();
	}
}

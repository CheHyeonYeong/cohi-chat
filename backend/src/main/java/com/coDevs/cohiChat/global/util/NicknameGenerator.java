package com.coDevs.cohiChat.global.util;

import org.springframework.stereotype.Component;
import java.security.SecureRandom;

/**
 * 랜덤 닉네임을 생성하는 유틸리티 클래스
 */
@Component
public class NicknameGenerator {

	private static final String[] FIRST = {"달콤한", "고소한", "포근한", "따뜻한"};
	private static final String[] SECOND = {"커피", "라떼", "카페", "모카"};
	private static final String[] THIRD = {"직장인", "개발자", "취준생", "방문자"};

	private static final SecureRandom RANDOM = new SecureRandom();

	/**
	 * 3단계 단어 조합을 통해 랜덤 닉네임을 생성합니다.
	 * @return 생성된 랜덤 닉네임 (예: 달콤한 라떼 개발자)
	 */
	public String generate() {
		return FIRST[RANDOM.nextInt(FIRST.length)] + " " +
			SECOND[RANDOM.nextInt(SECOND.length)] + " " +
			THIRD[RANDOM.nextInt(THIRD.length)];
	}
}

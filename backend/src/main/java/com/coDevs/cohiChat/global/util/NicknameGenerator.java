package com.coDevs.cohiChat.global.util;

import org.springframework.stereotype.Component;
import java.security.SecureRandom;
import java.util.stream.Collectors; // 추가 필요
import java.util.stream.Stream;    // 추가 필요

@Component
public class NicknameGenerator {

	private static final String[] FIRST = {"달콤한", "고소한", "포근한", "따뜻한"};
	private static final String[] SECOND = {"커피", "라떼", "카페", "모카"};
	private static final String[] THIRD = {"직장인", "개발자", "취준생", "방문자"};

	private static final SecureRandom RANDOM = new SecureRandom();

	/**
	 * Stream API를 사용하여 랜덤 닉네임을 생성합니다.
	 */
	public String generate() {
		return Stream.of(FIRST, SECOND, THIRD)
			.map(arr -> arr[RANDOM.nextInt(arr.length)])
			.collect(Collectors.joining(" "));
	}
}

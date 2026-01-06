package com.coDevs.cohiChat.global.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ErrorCode {

	DUPLICATED_USERNAME(422, "중복된 계정 ID입니다."),
	DUPLICATED_EMAIL(422, "중복된 E-mail 주소입니다."),
	USER_NOT_FOUND(404, "사용자가 없습니다."),
	PASSWORD_MISMATCH(401, "틀린 비밀번호입니다."),
	INVALID_TOKEN(401, "유효하지 않은 인증 토큰입니다."),
	EXPIRED_TOKEN(401, "만료된 인증 토큰입니다."),
	AUTH_NOT_PROVIDED(401, "로그인이 필요합니다.");

	private final int status;
	private final String message;
}

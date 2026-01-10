package com.coDevs.cohiChat.global.exception;

import org.springframework.http.HttpStatus;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ErrorCode {

	/**
	 * 계정, 인증 관련 예외들.
	 * 400: 잘못된 요청 (입력값 검증 실패)
	 * 401: 인증 실패 (토큰 문제, 로그인 실패)
	 * 403: 인증은 되었으나 권한 없음
	 */
	INVALID_USERNAME(HttpStatus.BAD_REQUEST, "유효하지 않은 계정 ID입니다."),
	INVALID_EMAIL(HttpStatus.BAD_REQUEST, "유효하지 않은 E-mail 주소입니다."),
	INVALID_PASSWORD(HttpStatus.BAD_REQUEST, "유효하지 않은 비밀번호입니다."),

	DUPLICATED_USERNAME(HttpStatus.CONFLICT, "중복된 계정 ID입니다."),
	DUPLICATED_EMAIL(HttpStatus.CONFLICT, "중복된 E-mail 주소입니다."),
	USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자가 없습니다."),

	PASSWORD_MISMATCH(HttpStatus.UNAUTHORIZED, "비밀번호가 일치하지 않습니다."),
	INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 인증 토큰입니다."),
	EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "만료된 인증 토큰입니다."),
	AUTH_NOT_PROVIDED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."),

	/**
	 * 캘린더, 타임슬롯, 예약 관련 예외들.
	 */
	HOST_NOT_FOUND(HttpStatus.NOT_FOUND, "호스트가 없습니다."),
	CALENDAR_NOT_FOUND(HttpStatus.NOT_FOUND, "캘린더가 없습니다."),
	TIMESLOT_NOT_FOUND(HttpStatus.NOT_FOUND, "시간대가 없습니다."),

	CALENDAR_ALREADY_EXISTS(HttpStatus.CONFLICT, "캘린더가 이미 존재합니다."),
	TIMESLOT_OVERLAP(HttpStatus.CONFLICT, "겹치는 시간대가 이미 존재합니다."),
	BOOKING_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 예약된 시간대입니다."),

	SELF_BOOKING(HttpStatus.UNPROCESSABLE_ENTITY, "자기 자신에게는 부킹을 할 수 없습니다."),
	PAST_BOOKING(HttpStatus.UNPROCESSABLE_ENTITY, "과거 일자에는 부킹을 할 수 없습니다."),
	INVALID_YEAR_MONTH(HttpStatus.UNPROCESSABLE_ENTITY, "유효하지 않은 년도 또는 월입니다."),

	GUEST_PERMISSION(HttpStatus.FORBIDDEN, "게스트는 캘린더를 생성할 수 없습니다.");

	private final HttpStatus status;
	private final String message;

}

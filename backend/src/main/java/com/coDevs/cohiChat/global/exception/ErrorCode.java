package com.coDevs.cohiChat.global.exception;

import org.springframework.http.HttpStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ErrorCode {

	/**
	 * 계정, 인증 관련 예외들
	 */
	INVALID_USERNAME(HttpStatus.BAD_REQUEST, "유효하지 않은 계정 ID입니다."),
	INVALID_EMAIL(HttpStatus.BAD_REQUEST, "유효하지 않은 E-mail 주소입니다."),
	INVALID_PASSWORD(HttpStatus.BAD_REQUEST, "유효하지 않은 비밀번호입니다."),
	INVALID_DISPLAY_NAME(HttpStatus.BAD_REQUEST, "유효하지 않은 닉네임입니다."),
	INVALID_ROLE(HttpStatus.BAD_REQUEST, "유효하지 않은 권한입니다."),

	DUPLICATED_USERNAME(HttpStatus.CONFLICT, "중복된 계정 ID입니다."),
	DUPLICATED_EMAIL(HttpStatus.CONFLICT, "중복된 E-mail 주소입니다."),
	USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자가 없습니다."),

	PASSWORD_MISMATCH(HttpStatus.UNAUTHORIZED, "비밀번호가 일치하지 않습니다."),
	INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 인증 토큰입니다."),
	EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "만료된 인증 토큰입니다."),
	AUTH_NOT_PROVIDED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."),

	ACCESS_DENIED(HttpStatus.FORBIDDEN, "해당 정보에 접근할 권한이 없습니다."),
	GUEST_PERMISSION(HttpStatus.FORBIDDEN, "게스트 권한으로는 이용할 수 없는 기능입니다."),

	/**
	 * 시스템 및 데이터베이스 관련
	 */
	DATABASE_CONNECTION_ERROR(HttpStatus.SERVICE_UNAVAILABLE, "데이터베이스 연결에 실패하였습니다."),
	DATABASE_SCHEMA_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "데이터베이스 구조 오류가 발생했습니다."),
	INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류가 발생했습니다."),

	INVALID_INPUT(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다."),

	/**
	 * 캘린더, 타임슬롯, 예약 관련 예외들
	 */
	HOST_NOT_FOUND(HttpStatus.NOT_FOUND, "호스트가 없습니다."),
	CALENDAR_NOT_FOUND(HttpStatus.NOT_FOUND, "캘린더가 없습니다."),
	TIMESLOT_NOT_FOUND(HttpStatus.NOT_FOUND, "시간대가 없습니다."),

	CALENDAR_ALREADY_EXISTS(HttpStatus.CONFLICT, "캘린더가 이미 존재합니다."),
	TIMESLOT_OVERLAP(HttpStatus.CONFLICT, "겹치는 시간대가 이미 존재합니다."),
	BOOKING_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 예약된 시간대입니다."),

	SELF_BOOKING(HttpStatus.UNPROCESSABLE_ENTITY, "자기 자신에게는 부킹을 할 수 없습니다."),
	PAST_BOOKING(HttpStatus.UNPROCESSABLE_ENTITY, "과거 일자에는 부킹을 할 수 없습니다."),
	INVALID_YEAR_MONTH(HttpStatus.UNPROCESSABLE_ENTITY, "유효하지 않은 년도 또는 월입니다.");

	private final HttpStatus status;
	private final String message;
}
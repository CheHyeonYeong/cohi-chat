package com.coDevs.cohiChat.global.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ErrorCode {

	/**
	 * 계정, 인증 관련 예외들.
	 */
	DUPLICATED_USERNAME_ERROR(422, "중복된 계정 ID입니다."),
	DUPLICATED_EMAIL_ERROR(422, "중복된 E-mail 주소입니다."),
	USER_NOT_FOUND_ERROR(404, "사용자가 없습니다."),
	PASSWORD_MISMATCH_ERROR(401, "틀린 비밀번호입니다."),
	INVALID_TOKEN_ERROR(401, "유효하지 않은 인증 토큰입니다."),
	EXPIRED_TOKEN_ERROR(401, "만료된 인증 토큰입니다."),
	AUTH_NOT_PROVIDED_ERROR(401, "로그인이 필요합니다."),

	/**
	 * 캘린더, 타임슬롯, 예약 관련 예외들.
	 */
	HOST_NOT_FOUND_ERROR(404, "호스트가 없습니다."),
	CALENDAR_NOT_FOUND_ERROR(404, "캘린더가 없습니다."),
	TIMESLOT_NOT_FOUND_ERROR(404, "시간대가 없습니다."),
	CALENDAR_ALREADY_EXISTS_ERROR(422, "캘린더가 이미 존재합니다."),
	TIMESLOT_OVERLAP_ERROR(422, "겹치는 시간대가 이미 존재합니다."),
	SELF_BOOKING_ERROR(422, "자기 자신에게는 부킹을 할 수 없습니다."),
	PAST_BOOKING_ERROR(422, "과거 일자에는 부킹을 할 수 없습니다."),
	BOOKING_ALREADY_EXISTS_ERROR(422, "이미 예약된 시간대입니다."),
	INVALID_YEAR_MONTH_ERROR(422, "유효하지 않은 년도 또은 월입니다."),
	GUEST_PERMISSION_ERROR(403, "게스트는 캘린더를 생성할 수 없습니다.");

	private final int status;
	private final String message;
}

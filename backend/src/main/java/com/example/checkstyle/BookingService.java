// package com.example.checkstyle;
//
// import java.time.LocalDate;
// import java.util.ArrayList;
// import java.util.List;
//
// /**
//  * 예약 관련 비즈니스 로직을 처리하는 서비스 클래스.
//  */
// public class BookingService {
//
// 	private static final int MAX_BOOKING_COUNT = 5;
//
// 	private int bookingCount;
//
// 	public BookingService() {
// 		this.bookingCount = 0;
// 	}
//
// 	public void createBooking(LocalDate meetingDate, boolean isAvailable, boolean hasPermission) {
// 		if (isAvailable
// 				&& hasPermission
// 				&& bookingCount < MAX_BOOKING_COUNT) {
// 			bookingCount++;
// 		}
// 	}
//
// 	public boolean canCancelBooking(boolean isExpired, boolean hasPermission) {
// 		boolean canCancel =
// 				!isExpired
// 						&& hasPermission
// 						&& bookingCount > 0;
//
// 		return canCancel;
// 	}
//
// 	void invalidMethodName() {
// 		// default 접근제어자 메서드 (Javadoc 없음 → OK)
// 	}
//
// 	public void InvalidMethodName() {
// 		// ❌ 메서드 이름 camelCase 위반 → Checkstyle 에러
// 	}
//
// 	public void tooLongLineExample() {
// 		String veryLongString = "이 문자열은 일부러 매우 길게 작성해서 한 줄이 120자를 초과하도록 만든 테스트용 문자열입니다. Checkstyle이 이 줄을 잡아내야 정상입니다.";
// 	}
//
// 	public void importTest() {
// 		List<String> list = new ArrayList<>();
// 	}
// }


-- [#446] 예약 목록 조회 인덱스 최적화
--
-- 문제:
--   Hibernate @Index 애너테이션은 columnList의 DESC 방향을 무시하여
--   실제 DB에 (guest_id, booking_date) ASC 인덱스로 생성됨.
--   ORDER BY booking_date DESC 쿼리에서 Index Scan Backward 발생,
--   페이지가 깊어질수록 Full-sort Groups가 증가하며 Sort 비용 누적.
--
-- 해결:
--   1. 잘못 생성된 ASC 인덱스 제거
--   2. DESC + id 티브레이커 + INCLUDE 컬럼으로 Index Only Scan 달성

-- 1. 기존 잘못 생성된 인덱스 제거 (Hibernate가 DESC 무시하고 ASC로 만든 것)
DROP INDEX IF EXISTS idx_booking_guest_list_covering;

-- 2. 게스트 목록 조회용 INCLUDE 인덱스
--    (guest_id, booking_date DESC, id DESC)
--      - booking_date DESC: ORDER BY 방향 일치 → Sort 단계 완전 제거
--      - id DESC: 동일 날짜 예약 여러 개일 때 페이지 경계 안정성 보장
--    INCLUDE (topic, attendance_status, time_slot_id)
--      - SELECT 컬럼을 인덱스에 포함 → booking 테이블 접근(Heap Fetch) 제거
--      - Index Scan → Index Only Scan으로 전환
CREATE INDEX idx_booking_guest_list_covering
    ON booking (guest_id, booking_date DESC, id DESC)
    INCLUDE (topic, attendance_status, time_slot_id);

-- 3. 호스트 목록 조회용: time_slot 인덱스
--    호스트 수 증가 시 time_slot 전체 스캔 방지
CREATE INDEX idx_time_slot_calendar_id
    ON time_slot (calendar_id, id);

-- 4. 호스트 목록 조회용: booking 인덱스
--    time_slot_id 기반 JOIN 최적화
CREATE INDEX idx_booking_host_list
    ON booking (time_slot_id, booking_date DESC, id DESC);

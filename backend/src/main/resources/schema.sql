-- 노쇼 신고 unique constraint 마이그레이션
-- (booking_id 단독) → (booking_id, reported_by) 복합 유니크로 전환
ALTER TABLE IF EXISTS noshow_history DROP CONSTRAINT IF EXISTS uq_noshow_history_booking_id;
ALTER TABLE IF EXISTS guest_noshow_history DROP CONSTRAINT IF EXISTS uq_guest_noshow_history_booking_id;

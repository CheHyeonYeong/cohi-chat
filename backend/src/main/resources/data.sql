-- QA 테스트 데이터
-- 비밀번호: test1234 (BCrypt 해시)

-- HOST 사용자 (호스트 등록 완료)
INSERT INTO member (id, username, display_name, email, hashed_password, provider, role, is_deleted, created_at, updated_at, host_registered_at)
SELECT '11111111-1111-1111-1111-111111111111', 'host1', '김호스트', 'host1@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqwSOJ4v6WGVPJOPxdV.nJFQ/W6.BYi', 'LOCAL', 'HOST', false, NOW(), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM member WHERE username = 'host1');

INSERT INTO member (id, username, display_name, email, hashed_password, provider, role, is_deleted, created_at, updated_at, host_registered_at)
SELECT '22222222-2222-2222-2222-222222222222', 'host2', '이호스트', 'host2@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqwSOJ4v6WGVPJOPxdV.nJFQ/W6.BYi', 'LOCAL', 'HOST', false, NOW(), NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM member WHERE username = 'host2');

-- GUEST 사용자
INSERT INTO member (id, username, display_name, email, hashed_password, provider, role, is_deleted, created_at, updated_at)
SELECT '33333333-3333-3333-3333-333333333333', 'guest1', '박게스트', 'guest1@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqwSOJ4v6WGVPJOPxdV.nJFQ/W6.BYi', 'LOCAL', 'GUEST', false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM member WHERE username = 'guest1');

INSERT INTO member (id, username, display_name, email, hashed_password, provider, role, is_deleted, created_at, updated_at)
SELECT '44444444-4444-4444-4444-444444444444', 'guest2', '최게스트', 'guest2@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqwSOJ4v6WGVPJOPxdV.nJFQ/W6.BYi', 'LOCAL', 'GUEST', false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM member WHERE username = 'guest2');

-- 호스트1 캘린더 (개인 캘린더 ID 사용)
INSERT INTO calendar (user_id, topics, description, google_calendar_id, calendar_accessible, created_at, updated_at)
SELECT '11111111-1111-1111-1111-111111111111', '["커리어 상담", "이력서 리뷰", "면접 준비"]', '10년차 백엔드 개발자입니다. 커리어 관련 고민이 있으시면 편하게 상담 신청해주세요!', 'host1@gmail.com', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM calendar WHERE user_id = '11111111-1111-1111-1111-111111111111');

-- 호스트2 캘린더 (그룹 캘린더 ID 사용)
INSERT INTO calendar (user_id, topics, description, google_calendar_id, calendar_accessible, created_at, updated_at)
SELECT '22222222-2222-2222-2222-222222222222', '["포트폴리오 피드백", "사이드 프로젝트 멘토링"]', '프론트엔드 개발자입니다. 포트폴리오 리뷰와 사이드 프로젝트 관련 멘토링을 제공합니다.', 'abcd1234@group.calendar.google.com', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM calendar WHERE user_id = '22222222-2222-2222-2222-222222222222');

-- 호스트1 타임슬롯
INSERT INTO time_slot (id, calendar_id, start_time, end_time, start_date, end_date)
SELECT 1, '11111111-1111-1111-1111-111111111111', '10:00:00', '11:00:00', CURRENT_DATE, DATEADD('MONTH', 3, CURRENT_DATE)
WHERE NOT EXISTS (SELECT 1 FROM time_slot WHERE id = 1);

INSERT INTO time_slot (id, calendar_id, start_time, end_time, start_date, end_date)
SELECT 2, '11111111-1111-1111-1111-111111111111', '14:00:00', '15:00:00', CURRENT_DATE, DATEADD('MONTH', 3, CURRENT_DATE)
WHERE NOT EXISTS (SELECT 1 FROM time_slot WHERE id = 2);

-- 호스트2 타임슬롯
INSERT INTO time_slot (id, calendar_id, start_time, end_time, start_date, end_date)
SELECT 3, '22222222-2222-2222-2222-222222222222', '09:00:00', '10:00:00', CURRENT_DATE, DATEADD('MONTH', 3, CURRENT_DATE)
WHERE NOT EXISTS (SELECT 1 FROM time_slot WHERE id = 3);

-- 타임슬롯 요일 설정 (0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토)
-- 호스트1 슬롯1: 월/수/금
INSERT INTO time_slot_weekday (time_slot_id, weekday)
SELECT 1, 1 WHERE NOT EXISTS (SELECT 1 FROM time_slot_weekday WHERE time_slot_id = 1 AND weekday = 1);
INSERT INTO time_slot_weekday (time_slot_id, weekday)
SELECT 1, 3 WHERE NOT EXISTS (SELECT 1 FROM time_slot_weekday WHERE time_slot_id = 1 AND weekday = 3);
INSERT INTO time_slot_weekday (time_slot_id, weekday)
SELECT 1, 5 WHERE NOT EXISTS (SELECT 1 FROM time_slot_weekday WHERE time_slot_id = 1 AND weekday = 5);

-- 호스트1 슬롯2: 화/목
INSERT INTO time_slot_weekday (time_slot_id, weekday)
SELECT 2, 2 WHERE NOT EXISTS (SELECT 1 FROM time_slot_weekday WHERE time_slot_id = 2 AND weekday = 2);
INSERT INTO time_slot_weekday (time_slot_id, weekday)
SELECT 2, 4 WHERE NOT EXISTS (SELECT 1 FROM time_slot_weekday WHERE time_slot_id = 2 AND weekday = 4);

-- 호스트2 슬롯: 월~금
INSERT INTO time_slot_weekday (time_slot_id, weekday)
SELECT 3, 1 WHERE NOT EXISTS (SELECT 1 FROM time_slot_weekday WHERE time_slot_id = 3 AND weekday = 1);
INSERT INTO time_slot_weekday (time_slot_id, weekday)
SELECT 3, 2 WHERE NOT EXISTS (SELECT 1 FROM time_slot_weekday WHERE time_slot_id = 3 AND weekday = 2);
INSERT INTO time_slot_weekday (time_slot_id, weekday)
SELECT 3, 3 WHERE NOT EXISTS (SELECT 1 FROM time_slot_weekday WHERE time_slot_id = 3 AND weekday = 3);
INSERT INTO time_slot_weekday (time_slot_id, weekday)
SELECT 3, 4 WHERE NOT EXISTS (SELECT 1 FROM time_slot_weekday WHERE time_slot_id = 3 AND weekday = 4);
INSERT INTO time_slot_weekday (time_slot_id, weekday)
SELECT 3, 5 WHERE NOT EXISTS (SELECT 1 FROM time_slot_weekday WHERE time_slot_id = 3 AND weekday = 5);

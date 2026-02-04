-- TimeSlot weekdays 정규화 마이그레이션
-- 기존 JSON 배열 weekdays 컬럼 → time_slot_weekday 테이블로 이전

-- 1. 새 테이블 생성 (Hibernate가 이미 생성했다면 무시됨)
CREATE TABLE IF NOT EXISTS time_slot_weekday (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time_slot_id BIGINT NOT NULL,
    weekday INTEGER NOT NULL,
    FOREIGN KEY (time_slot_id) REFERENCES time_slot(id) ON DELETE CASCADE
);

-- 2. 기존 JSON 데이터를 새 테이블로 이전
-- SQLite json_each() 함수로 JSON 배열을 개별 행으로 분리
-- 이미 마이그레이션된 데이터는 건너뜀
INSERT INTO time_slot_weekday (time_slot_id, weekday)
SELECT
    ts.id AS time_slot_id,
    CAST(je.value AS INTEGER) AS weekday
FROM time_slot ts, json_each(ts.weekdays) je
WHERE ts.weekdays IS NOT NULL
  AND ts.weekdays != ''
  AND ts.weekdays != '[]'
  AND NOT EXISTS (
      SELECT 1 FROM time_slot_weekday tsw
      WHERE tsw.time_slot_id = ts.id
  );

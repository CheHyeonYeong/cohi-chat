-- Calendar 테이블에 독립 PK 추가 및 Member FK 설정
-- 이 파일은 수동 마이그레이션 참고용입니다 (Flyway 미사용)
-- 실행 전 반드시 백업하세요

-- 1. 새 id 컬럼 추가 (UUID, NOT NULL)
ALTER TABLE calendar ADD COLUMN id UUID;

-- 2. 기존 행에 UUID 생성
UPDATE calendar SET id = gen_random_uuid() WHERE id IS NULL;

-- 3. id 컬럼에 NOT NULL 제약 추가
ALTER TABLE calendar ALTER COLUMN id SET NOT NULL;

-- 4. 기존 PK 제거 (user_id)
ALTER TABLE calendar DROP CONSTRAINT calendar_pkey;

-- 5. 새 PK 설정 (id)
ALTER TABLE calendar ADD CONSTRAINT calendar_pkey PRIMARY KEY (id);

-- 6. user_id에 UNIQUE 제약 추가
ALTER TABLE calendar ADD CONSTRAINT uq_calendar_user_id UNIQUE (user_id);

-- 7. user_id에 FK 추가 (ON DELETE CASCADE)
ALTER TABLE calendar ADD CONSTRAINT fk_calendar_member
    FOREIGN KEY (user_id) REFERENCES member(id) ON DELETE CASCADE;

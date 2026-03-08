-- 로컬 개발용 더미 데이터 (local 프로파일에서만 실행)
-- 비밀번호: dummy1234! (BCrypt 해시)

-- 중복 삽입 방지: 이미 데이터가 있으면 무시
-- H2 MODE=PostgreSQL에서는 MERGE INTO 또는 ON CONFLICT 사용

-- 더미 게스트 계정 (5명)
MERGE INTO member (id, username, display_name, email, hashed_password, provider, role, is_deleted, created_at, updated_at)
KEY (username)
VALUES
    (RANDOM_UUID(), 'dummy_guest_1', '더미 게스트 1', 'dummy_guest_1@dummy.test', '$2a$10$N9qo8uLOickgx2ZMRZoMyeNkPCBjLfAr0dJTpEyP1FfXh3S1yE5Ym', 'LOCAL', 'GUEST', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (RANDOM_UUID(), 'dummy_guest_2', '더미 게스트 2', 'dummy_guest_2@dummy.test', '$2a$10$N9qo8uLOickgx2ZMRZoMyeNkPCBjLfAr0dJTpEyP1FfXh3S1yE5Ym', 'LOCAL', 'GUEST', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (RANDOM_UUID(), 'dummy_guest_3', '더미 게스트 3', 'dummy_guest_3@dummy.test', '$2a$10$N9qo8uLOickgx2ZMRZoMyeNkPCBjLfAr0dJTpEyP1FfXh3S1yE5Ym', 'LOCAL', 'GUEST', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (RANDOM_UUID(), 'dummy_guest_4', '더미 게스트 4', 'dummy_guest_4@dummy.test', '$2a$10$N9qo8uLOickgx2ZMRZoMyeNkPCBjLfAr0dJTpEyP1FfXh3S1yE5Ym', 'LOCAL', 'GUEST', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (RANDOM_UUID(), 'dummy_guest_5', '더미 게스트 5', 'dummy_guest_5@dummy.test', '$2a$10$N9qo8uLOickgx2ZMRZoMyeNkPCBjLfAr0dJTpEyP1FfXh3S1yE5Ym', 'LOCAL', 'GUEST', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 더미 호스트 계정 (2명)
MERGE INTO member (id, username, display_name, email, hashed_password, provider, role, is_deleted, job, host_registered_at, created_at, updated_at)
KEY (username)
VALUES
    (RANDOM_UUID(), 'dummy_host_1', '더미 호스트 1', 'dummy_host_1@dummy.test', '$2a$10$N9qo8uLOickgx2ZMRZoMyeNkPCBjLfAr0dJTpEyP1FfXh3S1yE5Ym', 'LOCAL', 'HOST', false, '소프트웨어 엔지니어', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (RANDOM_UUID(), 'dummy_host_2', '더미 호스트 2', 'dummy_host_2@dummy.test', '$2a$10$N9qo8uLOickgx2ZMRZoMyeNkPCBjLfAr0dJTpEyP1FfXh3S1yE5Ym', 'LOCAL', 'HOST', false, '프로덕트 매니저', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

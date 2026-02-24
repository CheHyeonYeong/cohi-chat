package com.coDevs.cohiChat.global.config;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * SQLite 스키마 마이그레이션.
 * ddl-auto=update는 컬럼 삭제를 지원하지 않으므로,
 * 엔티티 리팩토링으로 제거된 컬럼을 수동으로 정리한다.
 */
@Configuration
public class SqliteMigrationConfig {

    private static final Logger log = LoggerFactory.getLogger(SqliteMigrationConfig.class);

    @Bean
    ApplicationRunner sqliteMigrationRunner(DataSource dataSource) {
        return args -> {
            try (var conn = dataSource.getConnection();
                 var stmt = conn.createStatement()) {

                // time_slot 테이블에 남아있는 레거시 weekdays 컬럼 제거
                // (weekdays는 time_slot_weekday 테이블로 분리됨)
                var rs = stmt.executeQuery(
                    "SELECT COUNT(*) FROM pragma_table_info('time_slot') WHERE name = 'weekdays'"
                );
                if (rs.next() && rs.getInt(1) > 0) {
                    stmt.execute("ALTER TABLE time_slot DROP COLUMN weekdays");
                    log.info("Migrated: dropped legacy 'weekdays' column from time_slot table");
                }

                // member 테이블에 provider 컬럼 추가 (OAuth 도입으로 신규 추가)
                // SQLite는 NOT NULL 컬럼을 DEFAULT 없이 추가 불가 → SqliteMigrationConfig에서 처리
                var rs2 = stmt.executeQuery(
                    "SELECT COUNT(*) FROM pragma_table_info('member') WHERE name = 'provider'"
                );
                if (rs2.next() && rs2.getInt(1) == 0) {
                    stmt.execute(
                        "ALTER TABLE member ADD COLUMN provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL' " +
                        "CHECK (provider IN ('LOCAL','KAKAO','GOOGLE'))"
                    );
                    log.info("Migrated: added 'provider' column to member table (existing rows set to LOCAL)");
                }

                // member 테이블 구조 개선:
                // 1. hashed_password NOT NULL → nullable (OAuth 회원은 비밀번호 없음)
                // 2. email NOT NULL → nullable (카카오 등 이메일 권한 없는 OAuth 공급자 대응)
                // 3. provider_id 컬럼 추가 (OAuth 공급자의 고유 사용자 ID)
                // 조건 중 하나라도 충족 시 테이블 재생성 (SQLite는 컬럼 제약 변경 불가)
                var rsHpw = stmt.executeQuery(
                    "SELECT \"notnull\" FROM pragma_table_info('member') WHERE name = 'hashed_password'"
                );
                var rsEmail = stmt.executeQuery(
                    "SELECT \"notnull\" FROM pragma_table_info('member') WHERE name = 'email'"
                );
                var rsPid = stmt.executeQuery(
                    "SELECT COUNT(*) FROM pragma_table_info('member') WHERE name = 'provider_id'"
                );
                boolean needMigration = (rsHpw.next() && rsHpw.getInt(1) == 1)
                    || (rsEmail.next() && rsEmail.getInt(1) == 1)
                    || (rsPid.next() && rsPid.getInt(1) == 0);

                if (needMigration) {
                    stmt.execute("DROP TABLE IF EXISTS member_migration_temp");
                    stmt.execute(
                        "CREATE TABLE member_migration_temp (" +
                        "  id BINARY(16) PRIMARY KEY," +
                        "  username VARCHAR(50) NOT NULL," +
                        "  display_name VARCHAR(50) NOT NULL," +
                        "  email VARCHAR(255)," +
                        "  hashed_password VARCHAR(255)," +
                        "  provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL' CHECK (provider IN ('LOCAL','KAKAO','GOOGLE'))," +
                        "  provider_id VARCHAR(100)," +
                        "  role VARCHAR(20) NOT NULL," +
                        "  created_at TIMESTAMP," +
                        "  updated_at TIMESTAMP," +
                        "  host_registered_at TIMESTAMP," +
                        "  is_deleted BOOLEAN NOT NULL DEFAULT 0," +
                        "  deleted_at TIMESTAMP" +
                        ")"
                    );
                    stmt.execute(
                        "INSERT INTO member_migration_temp " +
                        "  (id, username, display_name, email, hashed_password, provider, role," +
                        "   created_at, updated_at, host_registered_at, is_deleted, deleted_at) " +
                        "SELECT id, username, display_name, email, hashed_password, provider, role," +
                        "       created_at, updated_at, host_registered_at, is_deleted, deleted_at " +
                        "FROM member"
                    );
                    stmt.execute("DROP TABLE member");
                    stmt.execute("ALTER TABLE member_migration_temp RENAME TO member");
                    stmt.execute("DROP INDEX IF EXISTS uk_member_email_provider");
                    stmt.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_member_provider_provider_id ON member(provider, provider_id)");
                    stmt.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_member_username ON member(username)");
                    stmt.execute("CREATE INDEX IF NOT EXISTS idx_member_email ON member(email)");
                    stmt.execute("CREATE INDEX IF NOT EXISTS idx_member_username ON member(username)");
                    log.info("Migrated: added provider_id, made email/hashed_password nullable in member table");
                }

                // 기존 OAuth 회원의 provider_id 역산 채우기
                // username 형식: kakao_{providerId}, google_{providerId}
                stmt.execute(
                    "UPDATE member SET provider_id = SUBSTR(username, 7) " +
                    "WHERE provider = 'KAKAO' AND provider_id IS NULL AND username LIKE 'kakao_%'"
                );
                stmt.execute(
                    "UPDATE member SET provider_id = SUBSTR(username, 8) " +
                    "WHERE provider = 'GOOGLE' AND provider_id IS NULL AND username LIKE 'google_%'"
                );
                log.info("Migrated: backfilled provider_id for existing OAuth members");
            } catch (Exception e) {
                log.warn("SQLite migration skipped: {}", e.getMessage());
            }
        };
    }
}

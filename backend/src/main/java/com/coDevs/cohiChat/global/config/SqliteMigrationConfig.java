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
            } catch (Exception e) {
                log.warn("SQLite migration skipped: {}", e.getMessage());
            }
        };
    }
}

package com.coDevs.cohiChat.global.observability;

import javax.sql.DataSource;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import lombok.extern.slf4j.Slf4j;
import net.ttddyy.dsproxy.listener.logging.SLF4JLogLevel;
import net.ttddyy.dsproxy.support.ProxyDataSourceBuilder;

/**
 * DataSource를 프록시로 감싸서 Slow SQL을 로깅하는 설정.
 */
@Slf4j
@Configuration
@ConditionalOnProperty(
    name = "observability.slow-query.enabled",
    havingValue = "true",
    matchIfMissing = false
)
public class DataSourceProxyConfig {

    @Value("${observability.slow-query.threshold-ms:100}")
    private long slowQueryThresholdMs;

    @Bean
    @Primary
    public DataSource observabilityDataSource(@Qualifier("dataSource") DataSource originalDataSource) {
        log.info("DataSource proxy enabled with slow query threshold: {}ms", slowQueryThresholdMs);

        return ProxyDataSourceBuilder.create(originalDataSource)
            .name("cohichat-datasource")
            .logSlowQueryBySlf4j(slowQueryThresholdMs, TimeUnit.MILLISECONDS, SLF4JLogLevel.WARN)
            .build();
    }
}

package com.coDevs.cohiChat.global.observability;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.annotation.Configuration;

import lombok.extern.slf4j.Slf4j;
import net.ttddyy.dsproxy.support.ProxyDataSource;
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
public class DataSourceProxyConfig implements BeanPostProcessor {

    @Value("${observability.slow-query.threshold-ms:100}")
    private long slowQueryThresholdMs;

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        if (!"dataSource".equals(beanName) || !(bean instanceof javax.sql.DataSource dataSource)) {
            return bean;
        }
        if (bean instanceof ProxyDataSource) {
            return bean;
        }

        log.info("DataSource proxy enabled with slow query threshold: {}ms", slowQueryThresholdMs);
        return ProxyDataSourceBuilder.create(dataSource)
            .name("cohichat-datasource")
            .listener(new SlowQueryLoggingListener(slowQueryThresholdMs))
            .build();
    }
}

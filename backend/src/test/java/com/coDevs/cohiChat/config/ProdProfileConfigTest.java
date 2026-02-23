package com.coDevs.cohiChat.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.InputStream;
import java.util.Properties;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class ProdProfileConfigTest {

    @Test
    @DisplayName("application-prod.properties 파일이 존재해야 한다")
    void prodPropertiesFileShouldExist() {
        InputStream is = getClass().getResourceAsStream("/application-prod.properties");
        assertThat(is).as("application-prod.properties 파일이 없습니다").isNotNull();
    }

    @Test
    @DisplayName("prod 프로파일에서 ddl-auto는 validate여야 한다")
    void prodProfileDdlAutoShouldBeValidate() throws Exception {
        Properties props = new Properties();
        try (InputStream is = getClass().getResourceAsStream("/application-prod.properties")) {
            assertThat(is).as("application-prod.properties 파일이 없습니다").isNotNull();
            props.load(is);
        }
        assertThat(props.getProperty("spring.jpa.hibernate.ddl-auto"))
            .as("운영 환경에서는 ddl-auto가 validate여야 합니다")
            .isEqualTo("validate");
    }

    @Test
    @DisplayName("기본 application.properties에서 ddl-auto는 update여야 한다 (개발 환경)")
    void defaultDdlAutoShouldBeUpdate() throws Exception {
        Properties props = new Properties();
        try (InputStream is = getClass().getResourceAsStream("/application.properties")) {
            assertThat(is).as("application.properties 파일이 없습니다").isNotNull();
            props.load(is);
        }
        assertThat(props.getProperty("spring.jpa.hibernate.ddl-auto"))
            .as("개발 환경에서는 ddl-auto가 update여야 합니다")
            .isEqualTo("update");
    }
}

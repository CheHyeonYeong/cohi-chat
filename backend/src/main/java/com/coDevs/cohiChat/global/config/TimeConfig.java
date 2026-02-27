package com.coDevs.cohiChat.global.config;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TimeConfig {

	@Bean
	public Clock systemClock() {
		return Clock.systemUTC();
	}
}

package com.coDevs.cohiChat;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableAsync
public class CohiChatApplication {

	public static void main(String[] args) {
		SpringApplication.run(CohiChatApplication.class, args);
	}

}

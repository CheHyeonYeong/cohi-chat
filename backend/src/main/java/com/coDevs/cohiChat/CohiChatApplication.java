package com.coDevs.cohiChat;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class CohiChatApplication {

	public static void main(String[] args) {
		SpringApplication.run(CohiChatApplication.class, args);
	}

}

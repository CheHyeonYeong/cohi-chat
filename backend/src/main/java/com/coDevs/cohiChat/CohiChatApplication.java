package com.coDevs.cohiChat;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class CohiChatApplication {

	public static void main(String[] args) {
		SpringApplication.run(CohiChatApplication.class, args);
	}

}

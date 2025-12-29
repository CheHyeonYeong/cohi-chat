package com.coDevs.cohiChat.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

    @GetMapping("/hello")
    public String hello() {
        return "Hello World!";
    }

    @GetMapping("/api/hello")
    public HelloResponse helloJson() {
        return new HelloResponse("Hello World!", "Spring Boot is running successfully!");
    }

    record HelloResponse(String message, String status) {}
}

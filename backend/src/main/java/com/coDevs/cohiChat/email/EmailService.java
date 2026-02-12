package com.coDevs.cohiChat.email;

public interface EmailService {
    void sendPasswordResetEmail(String to, String resetLink);
}

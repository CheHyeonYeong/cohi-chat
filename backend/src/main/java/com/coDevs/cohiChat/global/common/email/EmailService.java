package com.coDevs.cohiChat.global.common.email;

public interface EmailService {

	void sendPasswordResetEmail(String to, String resetLink);
}

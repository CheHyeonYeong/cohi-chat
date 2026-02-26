package com.coDevs.cohiChat.global.common.email;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class JavaMailEmailService implements EmailService {

	private final JavaMailSender mailSender;

	@Override
	public void sendPasswordResetEmail(String to, String resetLink) {
		try {
			SimpleMailMessage message = new SimpleMailMessage();
			message.setTo(to);
			message.setSubject("[cohi-chat] 비밀번호 재설정 안내");
			message.setText(
				"안녕하세요, cohi-chat입니다.\n\n" +
				"비밀번호 재설정 요청이 접수되었습니다.\n" +
				"아래 링크를 클릭하여 비밀번호를 재설정해주세요.\n\n" +
				resetLink + "\n\n" +
				"링크는 30분 동안 유효합니다.\n" +
				"본인이 요청하지 않은 경우 이 이메일을 무시하세요."
			);
			mailSender.send(message);
		} catch (MailException e) {
			log.error("이메일 발송 실패: to={}, error={}", to, e.getMessage());
			throw new CustomException(ErrorCode.EMAIL_SEND_FAILED);
		}
	}
}

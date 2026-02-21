package com.coDevs.cohiChat.oauth;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OAuthStateService {

	private final OAuthStateRepository oAuthStateRepository;

	public String generateState() {
		String state = UUID.randomUUID().toString();
		oAuthStateRepository.save(OAuthState.create(state));
		return state;
	}

	/**
	 * state 파라미터를 검증하고 소비(Redis에서 삭제)한다.
	 * Redis에 존재하지 않으면 CSRF 공격으로 간주하여 예외를 던진다.
	 */
	public void validateAndConsumeState(String state) {
		if (state == null || state.isBlank()) {
			throw new CustomException(ErrorCode.INVALID_OAUTH_STATE);
		}
		OAuthState savedState = oAuthStateRepository.findById(state)
			.orElseThrow(() -> new CustomException(ErrorCode.INVALID_OAUTH_STATE));
		oAuthStateRepository.delete(savedState);
	}
}

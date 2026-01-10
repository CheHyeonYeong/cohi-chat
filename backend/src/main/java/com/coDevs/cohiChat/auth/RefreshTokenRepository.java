package com.coDevs.cohiChat.auth;

public interface RefreshTokenRepository {

	void  deleteByToken(String token);
}

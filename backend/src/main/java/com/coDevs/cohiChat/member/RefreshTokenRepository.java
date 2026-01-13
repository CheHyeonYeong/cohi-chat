package com.coDevs.cohiChat.member;

public interface RefreshTokenRepository {

	void  deleteByToken(String token);
}

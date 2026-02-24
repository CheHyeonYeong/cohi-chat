package com.coDevs.cohiChat.oauth;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.global.security.jwt.TokenService;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Provider;
import com.coDevs.cohiChat.member.response.LoginResponseDTO;

@Service
public class OAuthService {

	private final OAuthMemberService oAuthMemberService;
	private final TokenService tokenService;
	private final OAuthStateService oAuthStateService;
	private final Map<Provider, OAuthClient> oAuthClients;

	public OAuthService(
		OAuthMemberService oAuthMemberService,
		TokenService tokenService,
		OAuthStateService oAuthStateService,
		List<OAuthClient> oAuthClientList
	) {
		this.oAuthMemberService = oAuthMemberService;
		this.tokenService = tokenService;
		this.oAuthStateService = oAuthStateService;
		this.oAuthClients = oAuthClientList.stream()
			.collect(Collectors.toMap(OAuthClient::getProvider, Function.identity()));
	}

	public String getAuthorizationUrl(String providerName) {
		OAuthClient client = getClient(providerName);
		String state = oAuthStateService.generateState();
		return client.getAuthorizationUrl(state);
	}

	public LoginResponseDTO socialLogin(String providerName, String authorizationCode, String state) {
		// 0. CSRF state 검증 및 소비
		oAuthStateService.validateAndConsumeState(state);

		// 1. 외부 HTTP 호출 (트랜잭션 밖)
		OAuthClient client = getClient(providerName);
		OAuthUserInfo userInfo = client.getUserInfo(authorizationCode);

		// 2. DB 조회/저장 (별도 서비스의 트랜잭션 안)
		Member member = oAuthMemberService.findOrCreate(userInfo);

		// 3. 토큰 발급
		return tokenService.issueTokens(member);
	}

	private OAuthClient getClient(String providerName) {
		try {
			Provider provider = Provider.valueOf(providerName.toUpperCase());
			OAuthClient client = oAuthClients.get(provider);
			if (client == null) {
				throw new CustomException(ErrorCode.INVALID_PROVIDER);
			}
			return client;
		} catch (IllegalArgumentException e) {
			throw new CustomException(ErrorCode.INVALID_PROVIDER);
		}
	}
}

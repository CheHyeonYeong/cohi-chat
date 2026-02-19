package com.coDevs.cohiChat.oauth;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.global.security.jwt.TokenService;
import com.coDevs.cohiChat.member.MemberRepository;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Provider;
import com.coDevs.cohiChat.member.entity.Role;
import com.coDevs.cohiChat.member.response.LoginResponseDTO;

@Service
public class OAuthService {

	private final MemberRepository memberRepository;
	private final TokenService tokenService;
	private final Map<Provider, OAuthClient> oAuthClients;

	public OAuthService(
		MemberRepository memberRepository,
		TokenService tokenService,
		List<OAuthClient> oAuthClientList
	) {
		this.memberRepository = memberRepository;
		this.tokenService = tokenService;
		this.oAuthClients = oAuthClientList.stream()
			.collect(Collectors.toMap(OAuthClient::getProvider, Function.identity()));
	}

	public String getAuthorizationUrl(String providerName) {
		OAuthClient client = getClient(providerName);
		return client.getAuthorizationUrl();
	}

	public LoginResponseDTO socialLogin(String providerName, String authorizationCode) {
		// 1. 외부 HTTP 호출 (트랜잭션 밖)
		OAuthClient client = getClient(providerName);
		OAuthUserInfo userInfo = client.getUserInfo(authorizationCode);

		// 2. DB 조회/저장 (트랜잭션 안)
		Member member = findOrCreateMember(userInfo);

		// 3. 토큰 발급
		return tokenService.issueTokens(member);
	}

	@Transactional
	protected Member findOrCreateMember(OAuthUserInfo userInfo) {
		return memberRepository.findByEmailAndProviderAndIsDeletedFalse(
			userInfo.getEmail(), userInfo.getProvider()
		).orElseGet(() -> registerNewMember(userInfo));
	}

	private Member registerNewMember(OAuthUserInfo userInfo) {
		String username = userInfo.getProvider().name().toLowerCase() + "_" + userInfo.getProviderId();
		String displayName = (userInfo.getDisplayName() != null && !userInfo.getDisplayName().isBlank())
			? userInfo.getDisplayName() : username;

		Member member = Member.createOAuth(
			username,
			displayName,
			userInfo.getEmail(),
			userInfo.getProvider(),
			Role.GUEST
		);

		return memberRepository.save(member);
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

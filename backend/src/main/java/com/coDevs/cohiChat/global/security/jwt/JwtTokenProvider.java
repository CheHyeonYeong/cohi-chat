package com.coDevs.cohiChat.global.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Component
@Slf4j
public class JwtTokenProvider {

	private SecretKey key;

	@Value("${jwt.secret}")
	private String secretKey;

	@Value("${jwt.access-token-expiration}")
	private long accessTokenExpiration;

	@Value("${jwt.refresh-token-expiration}")
	private long refreshTokenExpiration;

	@PostConstruct
	protected void init() {
		this.key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
	}

	public String createAccessToken(String username, String role) {
		return createToken(username, role, accessTokenExpiration);
	}

	public String createRefreshToken(String username) {
		return createToken(username, null, refreshTokenExpiration);
	}

	private String createToken(String username, String role, long expirationTime) {
		Date now = new Date();

		var builder = Jwts.builder()
			.subject(username.toString())
			.issuedAt(now)
			.expiration(new Date(now.getTime() + expirationTime));

		if (role != null) {
			builder.claim("role", role);
		}

		return builder.signWith(key).compact();
	}

	public boolean validateToken(String token) {
		try {
			parseClaims(token);
			return true;
		} catch (ExpiredJwtException e) {
			log.warn("만료된 JWT 토큰");
			return false;
		} catch (JwtException | IllegalArgumentException e) {
			log.error("유효하지 않은 JWT 토큰");
			return false;
		}
	}

	public String getUsernameFromToken(String token) {
		return parseClaims(token).getSubject();
	}

	public String getRoleFromToken(String token) {
		return parseClaims(token).get("role", String.class);
	}

	private Claims parseClaims(String token) {
		return Jwts.parser()
			.verifyWith(key)
			.build()
			.parseSignedClaims(token)
			.getPayload();
	}

	public Authentication getAuthentication(String token) {

		String username = getUsernameFromToken(token);
		String roleStr = getRoleFromToken(token);

		String finalRole = (roleStr != null) ? roleStr : "GUEST";

		List<GrantedAuthority> authorities = Collections.singletonList(
			new SimpleGrantedAuthority("ROLE_" + finalRole)
		);

		UserDetails principal = new User(username.toString(), "", authorities);

		return new UsernamePasswordAuthenticationToken(principal, token, authorities);
	}
}

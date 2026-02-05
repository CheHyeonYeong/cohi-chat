package com.coDevs.cohiChat.global.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;

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

@Component
public class JwtTokenProvider {

	private SecretKey key;

	@Value("${jwt.secret}")
	private String secretKey;

	@Value("${jwt.access-token-expiration-ms}")
	private long accessTokenExpirationMs;

	@Value("${jwt.refresh-token-expiration-ms}")
	private long refreshTokenExpirationMs;

	@PostConstruct
	protected void init() {
		this.key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
	}

	public String createAccessToken(String username, String role) {
		return createToken(username, role, accessTokenExpirationMs);
	}

	public String createRefreshToken(String username) {
		return createToken(username, null, refreshTokenExpirationMs);
	}

	private String createToken(String username, String role, long expirationTimeMs) {
		Date now = new Date();

		var builder = Jwts.builder()
			.subject(username)
			.issuedAt(now)
			.expiration(new Date(now.getTime() + expirationTimeMs));

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
			return false;
		} catch (JwtException | IllegalArgumentException e) {
			return false;
		}
	}

	public void validateTokenOrThrow(String token) {
		parseClaims(token);
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

		UserDetails principal = new User(username, "", authorities);

		return new UsernamePasswordAuthenticationToken(principal, token, authorities);
	}

	public long getExpirationSeconds(String token) {
		Claims claims = parseClaims(token);
		Date expiration = claims.getExpiration();
		long now = new Date().getTime();

		return (expiration.getTime() - now) / 1000;
	}

	public long getRefreshTokenExpirationMs() {
		return refreshTokenExpirationMs;
	}
}

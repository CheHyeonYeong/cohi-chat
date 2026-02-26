package com.coDevs.cohiChat.global.common;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Objects;

public final class TokenHashUtils {

	private TokenHashUtils() {}

	public static String hash(String token) {
<<<<<<< HEAD
		Objects.requireNonNull(token, "token must not be null");
=======
>>>>>>> 30e3e0686e7101de034a2beb5eaaa52d7455c975
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hashBytes = digest.digest(token.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(hashBytes);
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException("SHA-256 algorithm not available", e);
		}
	}
}

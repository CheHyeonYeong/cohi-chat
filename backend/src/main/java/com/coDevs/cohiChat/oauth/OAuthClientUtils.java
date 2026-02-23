package com.coDevs.cohiChat.oauth;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

final class OAuthClientUtils {

	private OAuthClientUtils() {}

	static String encode(String value) {
		return URLEncoder.encode(value, StandardCharsets.UTF_8);
	}
}

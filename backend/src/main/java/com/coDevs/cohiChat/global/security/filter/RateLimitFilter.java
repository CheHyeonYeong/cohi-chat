package com.coDevs.cohiChat.global.security.filter;

import java.io.IOException;
import java.time.Duration;

import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import com.coDevs.cohiChat.global.config.RateLimitProperties;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.global.response.ApiResponseDTO;
import com.coDevs.cohiChat.global.response.ErrorResponseDTO;
import com.fasterxml.jackson.databind.ObjectMapper;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.distributed.BucketProxy;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

	private static final String REFRESH_PATH = "/members/v1/refresh";
	private static final String RATE_LIMIT_KEY_PREFIX = "rate-limit:refresh:";

	private final LettuceBasedProxyManager<String> proxyManager;
	private final RateLimitProperties properties;
	private final ObjectMapper objectMapper;

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
		throws ServletException, IOException {

		if (!isRefreshRequest(request)) {
			filterChain.doFilter(request, response);
			return;
		}

		String clientIp = resolveClientIp(request);
		String bucketKey = RATE_LIMIT_KEY_PREFIX + clientIp;

		try {
			BucketProxy bucket = proxyManager.builder()
				.build(bucketKey, this::createBucketConfiguration);

			ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

			if (probe.isConsumed()) {
				response.setHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
				filterChain.doFilter(request, response);
			} else {
				long retryAfterSeconds = Math.max(1,
					Duration.ofNanos(probe.getNanosToWaitForRefill()).toSeconds());
				writeRateLimitResponse(response, retryAfterSeconds);
			}
		} catch (Exception e) {
			log.warn("Rate limiting 처리 중 오류 발생 (fail-open): {}", e.getMessage());
			filterChain.doFilter(request, response);
		}
	}

	private boolean isRefreshRequest(HttpServletRequest request) {
		if (!HttpMethod.POST.matches(request.getMethod())) {
			return false;
		}
		String uri = request.getRequestURI();
		String contextPath = request.getContextPath();
		if (contextPath != null && !contextPath.isEmpty()) {
			uri = uri.substring(contextPath.length());
		}
		return REFRESH_PATH.equals(uri);
	}

	private String resolveClientIp(HttpServletRequest request) {
		String xForwardedFor = request.getHeader("X-Forwarded-For");
		if (xForwardedFor != null && !xForwardedFor.isBlank()) {
			return xForwardedFor.split(",")[0].trim();
		}

		String xRealIp = request.getHeader("X-Real-IP");
		if (xRealIp != null && !xRealIp.isBlank()) {
			return xRealIp.trim();
		}

		return request.getRemoteAddr();
	}

	private BucketConfiguration createBucketConfiguration() {
		return BucketConfiguration.builder()
			.addLimit(
				Bandwidth.builder()
					.capacity(properties.getCapacity())
					.refillGreedy(properties.getRefillTokens(),
						Duration.ofSeconds(properties.getRefillDurationSeconds()))
					.build()
			)
			.build();
	}

	private void writeRateLimitResponse(HttpServletResponse response, long retryAfterSeconds) throws IOException {
		ErrorCode errorCode = ErrorCode.RATE_LIMIT_EXCEEDED;
		ErrorResponseDTO errorResponse = new ErrorResponseDTO(errorCode.name(), errorCode.getMessage());
		ApiResponseDTO<Void> body = ApiResponseDTO.fail(errorResponse);

		response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.setCharacterEncoding("UTF-8");
		response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));

		objectMapper.writeValue(response.getWriter(), body);
	}
}

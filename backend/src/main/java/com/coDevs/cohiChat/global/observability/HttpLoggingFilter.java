package com.coDevs.cohiChat.global.observability;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

/**
 * HTTP 요청/응답을 로깅하는 필터.
 * Actuator 엔드포인트는 제외하고, 응답 시간이 500ms를 초과하면 WARN 레벨로 로깅한다.
 */
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class HttpLoggingFilter extends OncePerRequestFilter {

    @Value("${observability.http.slow-request-threshold-ms:500}")
    private long slowRequestThresholdMs;

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain chain
    ) throws ServletException, IOException {
        if (shouldSkip(request)) {
            chain.doFilter(request, response);
            return;
        }

        long startTime = System.currentTimeMillis();

        try {
            chain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            logRequest(request, response, duration);
        }
    }

    private boolean shouldSkip(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return uri.contains("/actuator");
    }

    private void logRequest(
        HttpServletRequest request,
        HttpServletResponse response,
        long duration
    ) {
        String method = request.getMethod();
        String path = request.getRequestURI();
        int status = response.getStatus();
        String message = String.format(
            "[http] [%s] method=%s path=%s status=%d durationMs=%d",
            resolveOutcome(status, duration),
            method,
            path,
            status,
            duration
        );

        if (status >= HttpStatus.INTERNAL_SERVER_ERROR.value()) {
            log.error(message);
            return;
        }
        if (status >= HttpStatus.BAD_REQUEST.value() || isSlow(duration)) {
            log.warn(message);
            return;
        }
        log.info(message);
    }

    private String resolveOutcome(int status, long duration) {
        if (status >= HttpStatus.INTERNAL_SERVER_ERROR.value() || status >= HttpStatus.BAD_REQUEST.value()) {
            return "FAIL";
        }
        if (isSlow(duration)) {
            return "SLOW";
        }
        return "SUCCESS";
    }

    private boolean isSlow(long duration) {
        return duration >= slowRequestThresholdMs;
    }
}

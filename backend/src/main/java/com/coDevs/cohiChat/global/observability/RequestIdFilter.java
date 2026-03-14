package com.coDevs.cohiChat.global.observability;

import java.io.IOException;
import java.util.regex.Pattern;
import java.util.UUID;

import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * HTTP 요청마다 고유한 Request ID를 생성하여 MDC에 저장하고 응답 헤더에 포함시키는 필터.
 * 분산 시스템에서 요청 추적을 위해 사용된다.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestIdFilter extends OncePerRequestFilter {

    public static final String REQUEST_ID = "request-id";
    public static final String REQUEST_ID_HEADER = "X-Request-ID";
    private static final Pattern SAFE_REQUEST_ID_PATTERN = Pattern.compile("[A-Za-z0-9-]{1,64}");

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain chain
    ) throws ServletException, IOException {
        String requestId = resolveRequestId(request.getHeader(REQUEST_ID_HEADER));

        MDC.put(REQUEST_ID, requestId);
        response.setHeader(REQUEST_ID_HEADER, requestId);

        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove(REQUEST_ID);
        }
    }

    private String resolveRequestId(String headerValue) {
        if (headerValue != null && SAFE_REQUEST_ID_PATTERN.matcher(headerValue).matches()) {
            return headerValue;
        }
        return UUID.randomUUID().toString().substring(0, 8);
    }
}

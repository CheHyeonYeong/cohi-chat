package com.coDevs.cohiChat.global.observability;

import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.MDC;

import lombok.extern.slf4j.Slf4j;
import net.ttddyy.dsproxy.ExecutionInfo;
import net.ttddyy.dsproxy.QueryInfo;
import net.ttddyy.dsproxy.listener.QueryExecutionListener;

@Slf4j
public class SlowQueryLoggingListener implements QueryExecutionListener {

    private static final int MAX_QUERY_LENGTH = 180;
    private final long slowQueryThresholdMs;

    public SlowQueryLoggingListener(long slowQueryThresholdMs) {
        this.slowQueryThresholdMs = slowQueryThresholdMs;
    }

    @Override
    public void beforeQuery(ExecutionInfo executionInfo, List<QueryInfo> queryInfoList) {
        // no-op
    }

    @Override
    public void afterQuery(ExecutionInfo executionInfo, List<QueryInfo> queryInfoList) {
        long durationMs = executionInfo.getElapsedTime();
        if (durationMs < slowQueryThresholdMs) {
            return;
        }

        StructuredLogMessage message = StructuredLogMessage.of("slowquery", "SLOW")
            .add("context", resolveContext())
            .add("datasource", executionInfo.getDataSourceName())
            .add("durationMs", durationMs)
            .add("thresholdMs", slowQueryThresholdMs)
            .add("statementType", executionInfo.getStatementType())
            .add("queryCount", queryInfoList == null ? 0 : queryInfoList.size())
            .add("success", executionInfo.isSuccess());

        String querySummary = summarizeQueries(queryInfoList);
        if (!querySummary.isBlank()) {
            message.add("query", querySummary);
        }

        Throwable throwable = executionInfo.getThrowable();
        if (throwable != null) {
            message.add("cause", throwable.getClass().getSimpleName());
        }

        log.warn(message.build());
    }

    private String resolveContext() {
        String requestId = MDC.get(RequestIdFilter.REQUEST_ID);
        return requestId == null || requestId.isBlank() ? "system" : "request";
    }

    private String summarizeQueries(List<QueryInfo> queryInfoList) {
        if (queryInfoList == null || queryInfoList.isEmpty()) {
            return "";
        }

        return queryInfoList.stream()
            .map(QueryInfo::getQuery)
            .filter(query -> query != null && !query.isBlank())
            .map(this::normalizeQuery)
            .collect(Collectors.joining(" || "));
    }

    private String normalizeQuery(String query) {
        String normalized = query.replaceAll("\\s+", " ").trim();
        if (normalized.length() <= MAX_QUERY_LENGTH) {
            return normalized;
        }
        return normalized.substring(0, MAX_QUERY_LENGTH - 3) + "...";
    }
}

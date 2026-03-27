package com.coDevs.cohiChat.global.observability;

import java.util.ArrayList;
import java.util.List;

public final class StructuredLogMessage {

    private final String action;
    private final String status;
    private final List<String> fields = new ArrayList<>();

    private StructuredLogMessage(String action, String status) {
        this.action = action;
        this.status = status;
    }

    public static StructuredLogMessage of(String action, String status) {
        return new StructuredLogMessage(action, status);
    }

    public StructuredLogMessage add(String key, Object value) {
        if (value == null) {
            return this;
        }

        String normalizedValue = String.valueOf(value).replaceAll("\\s+", " ").trim();
        if (normalizedValue.isEmpty()) {
            return this;
        }

        fields.add(key + "=" + formatValue(normalizedValue));
        return this;
    }

    public String build() {
        if (fields.isEmpty()) {
            return String.format("[%s] [%s]", action, status);
        }
        return String.format("[%s] [%s] %s", action, status, String.join(" ", fields));
    }

    private String formatValue(String value) {
        if (requiresQuoting(value)) {
            return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
        }
        return value;
    }

    private boolean requiresQuoting(String value) {
        return value.chars().anyMatch(Character::isWhitespace) || value.contains("\"");
    }
}

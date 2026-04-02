package com.coDevs.cohiChat.search.document;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

@Component
public class HostSearchSourceTextBuilder {

    private static final Pattern WHITESPACE = Pattern.compile("\\s+");

    public String build(HostSearchDocumentSource source) {
        List<String> sections = new ArrayList<>();

        normalize(source.job()).ifPresent(job -> sections.add("직업: " + job));

        List<String> topics = normalizeTopics(source.topics());
        if (!topics.isEmpty()) {
            sections.add("주제: " + String.join(", ", topics));
        }

        normalize(source.description()).ifPresent(description -> sections.add("소개: " + description));

        return String.join("\n", sections);
    }

    private List<String> normalizeTopics(List<String> topics) {
        if (topics == null || topics.isEmpty()) {
            return List.of();
        }

        LinkedHashSet<String> normalizedTopics = new LinkedHashSet<>();
        for (String topic : topics) {
            normalize(topic).ifPresent(normalizedTopics::add);
        }
        return List.copyOf(normalizedTopics);
    }

    private Optional<String> normalize(String value) {
        if (value == null) {
            return Optional.empty();
        }

        String normalized = WHITESPACE.matcher(value.trim()).replaceAll(" ");
        return normalized.isBlank() ? Optional.empty() : Optional.of(normalized);
    }
}

package com.coDevs.cohiChat.search;

import java.util.List;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.response.HostResponseDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HostSemanticSearchFacade {

    private static final int DEFAULT_LIMIT = 10;
    private static final int MAX_LIMIT = 20;

    private final ObjectProvider<SemanticHostSearchService> semanticHostSearchServiceProvider;

    public List<HostResponseDTO> searchHosts(String query, int limit) {
        String normalizedQuery = normalizeQuery(query);
        int normalizedLimit = normalizeLimit(limit);

        SemanticHostSearchService searchService = semanticHostSearchServiceProvider.getIfAvailable();
        if (searchService == null) {
            throw new CustomException(ErrorCode.SEMANTIC_SEARCH_UNAVAILABLE);
        }

        return searchService.searchHosts(normalizedQuery, normalizedLimit);
    }

    private String normalizeQuery(String query) {
        if (query == null) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }

        String normalized = query.trim().replaceAll("\\s+", " ");
        if (normalized.isBlank()) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }
        return normalized;
    }

    private int normalizeLimit(int limit) {
        if (limit <= 0) {
            return DEFAULT_LIMIT;
        }
        return Math.min(limit, MAX_LIMIT);
    }
}

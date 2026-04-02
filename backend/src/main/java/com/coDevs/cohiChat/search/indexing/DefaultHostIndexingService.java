package com.coDevs.cohiChat.search.indexing;

import org.springframework.stereotype.Service;

import com.coDevs.cohiChat.calendar.entity.Calendar;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.search.document.HostSearchDocumentSource;
import com.coDevs.cohiChat.search.document.HostSearchSourceTextBuilder;
import com.coDevs.cohiChat.search.embedding.EmbeddingGenerationResult;
import com.coDevs.cohiChat.search.embedding.EmbeddingService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DefaultHostIndexingService implements HostIndexingService {

    private final HostSearchSourceTextBuilder sourceTextBuilder;
    private final EmbeddingService embeddingService;

    @Override
    public HostIndexDocument build(Member member, Calendar calendar) {
        return build(HostSearchDocumentSource.from(member, calendar));
    }

    @Override
    public HostIndexDocument build(HostSearchDocumentSource source) {
        String sourceText = sourceTextBuilder.build(source);
        if (sourceText.isBlank()) {
            throw new IllegalArgumentException("sourceText must not be blank");
        }

        EmbeddingGenerationResult embedding = embeddingService.generate(sourceText);
        return new HostIndexDocument(source.hostId(), sourceText, embedding);
    }
}
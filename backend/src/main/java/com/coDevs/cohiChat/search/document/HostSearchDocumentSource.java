package com.coDevs.cohiChat.search.document;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import com.coDevs.cohiChat.calendar.entity.Calendar;
import com.coDevs.cohiChat.member.entity.Member;

public record HostSearchDocumentSource(
    UUID hostId,
    String job,
    List<String> topics,
    String description
) {

    public HostSearchDocumentSource {
        topics = topics == null ? List.of() : Collections.unmodifiableList(new ArrayList<>(topics));
    }

    public static HostSearchDocumentSource from(Member member, Calendar calendar) {
        Objects.requireNonNull(member, "member must not be null");
        Objects.requireNonNull(calendar, "calendar must not be null");

        UUID memberId = member.getId();
        UUID calendarUserId = calendar.getUserId();

        if (memberId != null && calendarUserId != null && !memberId.equals(calendarUserId)) {
            throw new IllegalArgumentException("member.id and calendar.userId must match");
        }

        UUID hostId = memberId != null ? memberId : calendarUserId;

        return new HostSearchDocumentSource(
            hostId,
            member.getJob(),
            calendar.getTopics(),
            calendar.getDescription()
        );
    }
}
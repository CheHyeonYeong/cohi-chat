package com.coDevs.cohiChat.calendar.entity;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.FetchType;

import com.coDevs.cohiChat.member.entity.Member;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "calendar")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Calendar {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "user_id",
        nullable = false,
        unique = true,
        foreignKey = @ForeignKey(name = "fk_calendar_member")
    )
    private Member member;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "topics", nullable = false, columnDefinition = "TEXT")
    private List<String> topics;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "google_calendar_id", nullable = false, length = 1024)
    private String googleCalendarId;

    @Column(name = "calendar_accessible")
    private Boolean calendarAccessible;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    public static Calendar create(
        Member member,
        List<String> topics,
        String description,
        String googleCalendarId
    ) {
        Calendar calendar = new Calendar();
        calendar.member = member;
        calendar.topics = topics;
        calendar.description = description;
        calendar.googleCalendarId = googleCalendarId;

        return calendar;
    }

    /**
     * 하위 호환성을 위한 편의 메서드
     * @return member의 ID (userId)
     */
    public UUID getUserId() {
        return member != null ? member.getId() : null;
    }

    public void update(List<String> topics, String description, String googleCalendarId) {
        this.topics = topics;
        this.description = description;
        this.googleCalendarId = googleCalendarId;
    }

    public void setCalendarAccessible(boolean accessible) {
        this.calendarAccessible = accessible;
    }

}

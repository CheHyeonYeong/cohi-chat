package com.coDevs.cohiChat.member.entity;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;

import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "member", indexes = {
        @Index(name = "idx_member_email", columnList = "email"),
        @Index(name = "idx_member_username", columnList = "username")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_member_provider_provider_id", columnNames = {"provider", "provider_id"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member {

        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        @Column(columnDefinition = "uuid")
        private UUID id;

        /**
         *  사용자 로그인 아이디
         */

        @Column(length = 50, nullable = false, updatable = false, unique = true)
        private String username;

        @Column(name = "display_name", length = 50, nullable = false)
        private String displayName;

        @Column(length = 255, nullable = true)
        private String email;

        @Column(name = "hashed_password", nullable = true)
        private String hashedPassword;

        @Enumerated(EnumType.STRING)
        @Column(name = "provider", nullable = false, updatable = false, length = 20)
        private Provider provider = Provider.LOCAL;

        @Column(name = "provider_id", length = 100, nullable = true, updatable = false)
        private String providerId;


        @Enumerated(EnumType.STRING)
        @Column(name = "role", nullable = false, length = 20)
        private Role role;

        @CreatedDate
        @Column(name = "created_at", updatable = false)
        private Instant createdAt;

        @LastModifiedDate
        @Column(name = "updated_at", updatable = true)
        private Instant updatedAt;

        @Column(name = "host_registered_at")
        private Instant hostRegisteredAt;

        @Column(name = "is_deleted", nullable = false)
        private boolean isDeleted = false;

        @Column(name = "deleted_at")
        private Instant deletedAt;

        @Column(name = "job", length = 100)
        private String job;

        @Column(name = "profile_image_url", length = 500)
        private String profileImageUrl;


        public static Member create(
                String username,
                String displayName,
                String email,
                String hashedPassword,
                Role role
        ) {
                validateRequired(username, displayName, role);
                if (email == null || email.isBlank()) throw new CustomException(ErrorCode.INVALID_EMAIL);
                if (hashedPassword == null || hashedPassword.isBlank()) throw new CustomException(ErrorCode.INVALID_PASSWORD);

                Member member = new Member();
                member.username = username;
                member.displayName = displayName;
                member.email = email;
                member.hashedPassword = hashedPassword;
                member.provider = Provider.LOCAL;
                member.role = role;
                member.isDeleted = false;

                return member;
        }

        public static Member createOAuth(
                String username,
                String displayName,
                String email,
                String providerId,
                Provider provider,
                Role role
        ) {
                validateRequired(username, displayName, role);
                if (provider == null || provider == Provider.LOCAL) throw new CustomException(ErrorCode.INVALID_PROVIDER);
                if (providerId == null || providerId.isBlank()) throw new CustomException(ErrorCode.INVALID_PROVIDER);

                Member member = new Member();
                member.username = username;
                member.displayName = displayName;
                member.email = email;
                member.hashedPassword = null;
                member.provider = provider;
                member.providerId = providerId;
                member.role = role;
                member.isDeleted = false;

                return member;
        }

        private static void validateRequired(String username, String displayName, Role role) {
                if (username == null || username.isBlank()) throw new CustomException(ErrorCode.INVALID_USERNAME);
                if (displayName == null || displayName.isBlank()) throw new CustomException(ErrorCode.INVALID_DISPLAY_NAME);
                if (role == null) throw new CustomException(ErrorCode.INVALID_ROLE);
        }

        public void updateInfo(String displayName, String hashedPassword) {
                if (displayName != null && !displayName.isBlank()) {
                        this.displayName = displayName;
                }
                if (hashedPassword != null && !hashedPassword.isBlank() && this.provider == Provider.LOCAL) {
                        this.hashedPassword = hashedPassword;
                }
        }

        public void updateDisplayName(String displayName) {
                if (displayName == null || displayName.isBlank()) {
                        throw new CustomException(ErrorCode.INVALID_DISPLAY_NAME);
                }
                this.displayName = displayName;
        }

        public void updateProfile(String job, String profileImageUrl) {
                if (job != null) {
                        this.job = job.isBlank() ? null : job;
                }
                if (profileImageUrl != null) {
                        this.profileImageUrl = profileImageUrl.isBlank() ? null : profileImageUrl;
                }
        }

        public void softDelete() {
                this.isDeleted = true;
                this.deletedAt = Instant.now();
        }

        public void restore() {
                this.isDeleted = false;
                this.deletedAt = null;
        }

        public void promoteToHost() {
                if (this.role == Role.HOST) {
                        throw new CustomException(ErrorCode.ALREADY_HOST);
                }
                if (this.role != Role.GUEST) {
                        throw new CustomException(ErrorCode.ACCESS_DENIED);
                }
                this.role = Role.HOST;
                this.hostRegisteredAt = Instant.now();
        }

        public boolean isActive() {
                return !isDeleted;
        }
}

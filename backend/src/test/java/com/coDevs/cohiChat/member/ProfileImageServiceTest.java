package com.coDevs.cohiChat.member;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.coDevs.cohiChat.global.common.file.CloudFrontUrlService;
import com.coDevs.cohiChat.global.common.file.S3PresignedUrlService;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;

@ExtendWith(MockitoExtension.class)
class ProfileImageServiceTest {

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private S3PresignedUrlService s3PresignedUrlService;

    @Mock
    private ProfileImageUploadValidator validator;

    @Mock
    private CloudFrontUrlService cloudFrontUrlService;

    @InjectMocks
    private ProfileImageService profileImageService;

    private static final String USERNAME = "testuser";
    private static final UUID MEMBER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID ATTACKER_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    private Member member;

    @BeforeEach
    void setUp() {
        member = Member.create(USERNAME, "TestUser", "test@test.com", "hashedPw", Role.GUEST);
        ReflectionTestUtils.setField(member, "id", MEMBER_ID);
    }

    @Test
    @DisplayName("confirmUpload: 다른 사용자의 objectKey로 확인 요청 시 ACCESS_DENIED")
    void confirmUploadWithOtherUserObjectKeyThrowsAccessDenied() {
        var attackerObjectKey = "profile-images/" + ATTACKER_ID + "/evil.jpg";

        given(memberRepository.findByUsernameAndIsDeletedFalse(USERNAME))
                .willReturn(Optional.of(member));

        assertThatThrownBy(() ->
                profileImageService.confirmUpload(USERNAME, attackerObjectKey))
                .isInstanceOf(CustomException.class)
                .extracting(e -> ((CustomException) e).getErrorCode())
                .isEqualTo(ErrorCode.ACCESS_DENIED);

        verify(s3PresignedUrlService, never()).getObjectMetadata(attackerObjectKey);
    }

    @Test
    @DisplayName("confirmUpload: 자신의 objectKey로 확인 요청 시 정상 처리")
    void confirmUploadWithOwnObjectKeySucceeds() {
        var ownObjectKey = "profile-images/" + MEMBER_ID + "/photo.jpg";
        var metadata = new S3PresignedUrlService.S3ObjectMetadata(1024L, "image/jpeg");
        var expectedUrl = "https://test.cloudfront.net/" + ownObjectKey;

        given(memberRepository.findByUsernameAndIsDeletedFalse(USERNAME))
                .willReturn(Optional.of(member));
        given(s3PresignedUrlService.getObjectMetadata(ownObjectKey))
                .willReturn(Optional.of(metadata));
        given(cloudFrontUrlService.generatePublicUrl(ownObjectKey))
                .willReturn(expectedUrl);

        String result = profileImageService.confirmUpload(USERNAME, ownObjectKey);

        assertThat(result).isEqualTo(expectedUrl);
        verify(s3PresignedUrlService).getObjectMetadata(ownObjectKey);
        verify(cloudFrontUrlService).generatePublicUrl(ownObjectKey);
        verify(memberRepository).save(member);
    }
}

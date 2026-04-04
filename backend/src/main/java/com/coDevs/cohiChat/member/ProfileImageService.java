package com.coDevs.cohiChat.member;

import java.time.Duration;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coDevs.cohiChat.global.common.file.CloudFrontUrlService;
import com.coDevs.cohiChat.global.common.file.S3PresignedUrlService;
import com.coDevs.cohiChat.global.common.file.S3PresignedUrlService.S3ObjectMetadata;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.response.ProfileImageUploadResponseDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProfileImageService {

    private static final String PROFILE_IMAGE_PREFIX = "profile-images/";
    private static final Duration UPLOAD_URL_EXPIRATION = Duration.ofMinutes(15);

    private final MemberRepository memberRepository;
    private final S3PresignedUrlService s3PresignedUrlService;
    private final ProfileImageUploadValidator validator;
    private final CloudFrontUrlService cloudFrontUrlService;

    /**
     * Presigned URL 생성 (클라이언트 직접 업로드용)
     */
    public ProfileImageUploadResponseDTO generatePresignedUploadUrl(
            String username,
            String fileName,
            String contentType,
            long fileSize
    ) {
        validator.validate(fileName, contentType, fileSize);

        var member = findMemberByUsername(username);
        var objectKey = generateObjectKey(member.getId(), fileName);
        var uploadUrl = s3PresignedUrlService.generateUploadUrl(objectKey, UPLOAD_URL_EXPIRATION, contentType);

        return ProfileImageUploadResponseDTO.of(uploadUrl, objectKey);
    }

    /**
     * 업로드 확인 및 프로필 이미지 URL 저장
     */
    @Transactional
    public String confirmUpload(String username, String objectKey) {
        var member = findMemberByUsername(username);

        var expectedPrefix = PROFILE_IMAGE_PREFIX + member.getId() + "/";
        if (!objectKey.startsWith(expectedPrefix)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        var metadata = s3PresignedUrlService.getObjectMetadata(objectKey)
                .orElseThrow(() -> new CustomException(ErrorCode.FILE_NOT_FOUND));

        validateUploadedFile(metadata);
        deleteExistingProfileImage(member);

        var profileImageUrl = generatePublicUrl(objectKey);
        member.updateProfile(null, profileImageUrl);
        memberRepository.save(member);

        return profileImageUrl;
    }

    /**
     * 프로필 이미지 삭제
     */
    @Transactional
    public void deleteProfileImage(String username) {
        var member = findMemberByUsername(username);
        var profileImageUrl = member.getProfileImageUrl();

        if (profileImageUrl == null || profileImageUrl.isBlank()) {
            return;
        }

        extractObjectKeyFromUrl(profileImageUrl)
                .ifPresent(s3PresignedUrlService::deleteObjectQuietly);

        member.updateProfile(null, "");
        memberRepository.save(member);
    }

    private Member findMemberByUsername(String username) {
        return memberRepository.findByUsernameAndIsDeletedFalse(username)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }

    private void validateUploadedFile(S3ObjectMetadata metadata) {
        validator.validateFileSize(metadata.contentLength());
        validator.validateMimeType(metadata.contentType());
    }

    private void deleteExistingProfileImage(Member member) {
        var oldImageUrl = member.getProfileImageUrl();
        if (oldImageUrl != null && !oldImageUrl.isBlank()) {
            extractObjectKeyFromUrl(oldImageUrl)
                    .ifPresent(s3PresignedUrlService::deleteObjectQuietly);
        }
    }

    private String generateObjectKey(UUID memberId, String fileName) {
        var extension = extractExtension(fileName);
        var uniqueFileName = UUID.randomUUID().toString();
        return PROFILE_IMAGE_PREFIX + memberId + "/" + uniqueFileName + "." + extension;
    }

    private String extractExtension(String fileName) {
        int lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex == -1 || lastDotIndex == fileName.length() - 1) {
            return "jpg";
        }
        return fileName.substring(lastDotIndex + 1).toLowerCase();
    }

    private String generatePublicUrl(String objectKey) {
        return cloudFrontUrlService.generatePublicUrl(objectKey);
    }

    private java.util.Optional<String> extractObjectKeyFromUrl(String url) {
        return cloudFrontUrlService.extractObjectKeyFromUrl(url);
    }
}

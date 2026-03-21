package com.coDevs.cohiChat.member;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Value("${aws.s3.bucket}")
    private String bucketName;

    @Value("${aws.cloudfront.domain:}")
    private String cloudfrontDomain;

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

        Member member = memberRepository.findByUsernameAndIsDeletedFalse(username)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        String objectKey = generateObjectKey(member.getId(), fileName);
        String uploadUrl = s3PresignedUrlService.generateUploadUrl(objectKey, UPLOAD_URL_EXPIRATION, contentType);

        return ProfileImageUploadResponseDTO.builder()
                .uploadUrl(uploadUrl)
                .objectKey(objectKey)
                .build();
    }

    /**
     * 업로드 확인 및 프로필 이미지 URL 저장
     */
    @Transactional
    public String confirmUpload(String username, String objectKey) {
        Member member = memberRepository.findByUsernameAndIsDeletedFalse(username)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // S3에 파일이 존재하는지 확인
        Optional<S3ObjectMetadata> metadata = s3PresignedUrlService.getObjectMetadata(objectKey);
        if (metadata.isEmpty()) {
            throw new CustomException(ErrorCode.FILE_NOT_FOUND);
        }

        // 파일 크기 및 타입 재검증
        S3ObjectMetadata meta = metadata.get();
        validator.validateFileSize(meta.contentLength());
        validator.validateMimeType(meta.contentType());

        // 기존 프로필 이미지가 있으면 삭제
        String oldImageUrl = member.getProfileImageUrl();
        if (oldImageUrl != null && !oldImageUrl.isBlank()) {
            String oldObjectKey = extractObjectKeyFromUrl(oldImageUrl);
            if (oldObjectKey != null) {
                s3PresignedUrlService.deleteObjectQuietly(oldObjectKey);
            }
        }

        // 새 프로필 이미지 URL 생성 및 저장
        String profileImageUrl = generatePublicUrl(objectKey);
        member.updateProfile(null, profileImageUrl);
        memberRepository.save(member);

        return profileImageUrl;
    }

    /**
     * 프로필 이미지 삭제
     */
    @Transactional
    public void deleteProfileImage(String username) {
        Member member = memberRepository.findByUsernameAndIsDeletedFalse(username)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        String profileImageUrl = member.getProfileImageUrl();
        if (profileImageUrl == null || profileImageUrl.isBlank()) {
            return; // 이미 없음, 정상 처리
        }

        // S3에서 파일 삭제
        String objectKey = extractObjectKeyFromUrl(profileImageUrl);
        if (objectKey != null) {
            s3PresignedUrlService.deleteObjectQuietly(objectKey);
        }

        // DB에서 URL 제거
        member.updateProfile(null, "");
        memberRepository.save(member);
    }

    private String generateObjectKey(UUID memberId, String fileName) {
        String extension = extractExtension(fileName);
        String uniqueFileName = UUID.randomUUID().toString();
        return PROFILE_IMAGE_PREFIX + memberId.toString() + "/" + uniqueFileName + "." + extension;
    }

    private String extractExtension(String fileName) {
        int lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex == -1 || lastDotIndex == fileName.length() - 1) {
            return "jpg"; // 기본값
        }
        return fileName.substring(lastDotIndex + 1).toLowerCase();
    }

    private String generatePublicUrl(String objectKey) {
        if (cloudfrontDomain != null && !cloudfrontDomain.isBlank()) {
            return "https://" + cloudfrontDomain + "/" + objectKey;
        }
        // CloudFront 미설정 시 S3 직접 URL 사용
        return "https://" + bucketName + ".s3.amazonaws.com/" + objectKey;
    }

    private String extractObjectKeyFromUrl(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }

        // CloudFront URL에서 추출
        if (cloudfrontDomain != null && !cloudfrontDomain.isBlank() && url.contains(cloudfrontDomain)) {
            int prefixIndex = url.indexOf(cloudfrontDomain);
            return url.substring(prefixIndex + cloudfrontDomain.length() + 1);
        }

        // S3 URL에서 추출
        String s3Prefix = bucketName + ".s3.amazonaws.com/";
        if (url.contains(s3Prefix)) {
            int prefixIndex = url.indexOf(s3Prefix);
            return url.substring(prefixIndex + s3Prefix.length());
        }

        return null;
    }
}

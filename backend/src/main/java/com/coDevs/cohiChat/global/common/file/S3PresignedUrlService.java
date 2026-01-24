package com.coDevs.cohiChat.global.common.file;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

@Service
public class S3PresignedUrlService {

    private static final Duration DEFAULT_EXPIRATION = Duration.ofMinutes(15);

    private final String bucketName;
    private final String region;

    public S3PresignedUrlService(
            @Value("${aws.s3.bucket}") String bucketName,
            @Value("${aws.region}") String region) {
        this.bucketName = bucketName;
        this.region = region;
    }

    /**
     * 다운로드용 Presigned URL 생성 (GET)
     *
     * @param objectKey S3 객체 키
     * @return Presigned URL 문자열
     */
    public String generateDownloadUrl(String objectKey) {
        return generateDownloadUrl(objectKey, DEFAULT_EXPIRATION);
    }

    /**
     * 다운로드용 Presigned URL 생성 (GET) - 만료 시간 지정
     *
     * @param objectKey  S3 객체 키
     * @param expiration URL 만료 시간
     * @return Presigned URL 문자열
     */
    public String generateDownloadUrl(String objectKey, Duration expiration) {
        try (S3Presigner presigner = createPresigner()) {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(objectKey)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(expiration)
                    .getObjectRequest(getObjectRequest)
                    .build();

            PresignedGetObjectRequest presignedRequest = presigner.presignGetObject(presignRequest);
            return presignedRequest.url().toString();
        }
    }

    /**
     * 업로드용 Presigned URL 생성 (PUT) - 클라이언트 직접 업로드용
     *
     * @param objectKey S3 객체 키
     * @return Presigned URL 문자열
     */
    public String generateUploadUrl(String objectKey) {
        return generateUploadUrl(objectKey, DEFAULT_EXPIRATION, null);
    }

    /**
     * 업로드용 Presigned URL 생성 (PUT) - 만료 시간 지정
     *
     * @param objectKey  S3 객체 키
     * @param expiration URL 만료 시간
     * @return Presigned URL 문자열
     */
    public String generateUploadUrl(String objectKey, Duration expiration) {
        return generateUploadUrl(objectKey, expiration, null);
    }

    /**
     * 업로드용 Presigned URL 생성 (PUT) - 만료 시간 및 Content-Type 지정
     *
     * @param objectKey   S3 객체 키
     * @param expiration  URL 만료 시간
     * @param contentType 업로드할 파일의 Content-Type (null인 경우 지정하지 않음)
     * @return Presigned URL 문자열
     */
    public String generateUploadUrl(String objectKey, Duration expiration, String contentType) {
        try (S3Presigner presigner = createPresigner()) {
            PutObjectRequest.Builder putObjectRequestBuilder = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(objectKey);

            if (contentType != null && !contentType.isBlank()) {
                putObjectRequestBuilder.contentType(contentType);
            }

            PutObjectRequest putObjectRequest = putObjectRequestBuilder.build();

            PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                    .signatureDuration(expiration)
                    .putObjectRequest(putObjectRequest)
                    .build();

            PresignedPutObjectRequest presignedRequest = presigner.presignPutObject(presignRequest);
            return presignedRequest.url().toString();
        }
    }

    private S3Presigner createPresigner() {
        return S3Presigner.builder()
                .region(Region.of(region))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }
}

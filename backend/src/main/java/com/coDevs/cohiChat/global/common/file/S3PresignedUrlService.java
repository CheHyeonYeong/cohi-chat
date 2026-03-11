package com.coDevs.cohiChat.global.common.file;

import java.time.Duration;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

@Service
@RequiredArgsConstructor
public class S3PresignedUrlService {

    private static final Duration DEFAULT_EXPIRATION = Duration.ofMinutes(15);

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucket}")
    private String bucketName;

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
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(expiration)
                .getObjectRequest(getObjectRequest)
                .build();

        PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
        return presignedRequest.url().toString();
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

        PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);
        return presignedRequest.url().toString();
    }

    public Optional<S3ObjectMetadata> getObjectMetadata(String objectKey) {
        HeadObjectRequest request = HeadObjectRequest.builder()
            .bucket(bucketName)
            .key(objectKey)
            .build();

        try {
            HeadObjectResponse response = s3Client.headObject(request);
            return Optional.of(new S3ObjectMetadata(response.contentLength(), response.contentType()));
        } catch (NoSuchKeyException e) {
            return Optional.empty();
        } catch (S3Exception e) {
            if (e.statusCode() == 404) {
                return Optional.empty();
            }
            throw e;
        }
    }

    public void deleteObjectQuietly(String objectKey) {
        DeleteObjectRequest request = DeleteObjectRequest.builder()
            .bucket(bucketName)
            .key(objectKey)
            .build();

        try {
            s3Client.deleteObject(request);
        } catch (Exception ignored) {
            // orphan cleanup is best-effort
        }
    }

    public record S3ObjectMetadata(long contentLength, String contentType) {}
}

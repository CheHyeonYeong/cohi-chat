package com.coDevs.cohiChat.global.common.file;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class CloudFrontUrlService {

    @Value("${aws.s3.bucket}")
    private String bucketName;

    @Value("${aws.cloudfront.domain:}")
    private String cloudfrontDomain;

    /**
     * S3 URL을 CloudFront URL로 변환
     * CloudFront 도메인이 설정되지 않은 경우 원본 URL 반환
     *
     * @param s3Url S3 presigned URL 또는 S3 직접 URL
     * @return CloudFront URL 또는 원본 URL
     */
    public String toCloudFrontUrl(String s3Url) {
        if (!isCloudFrontEnabled() || s3Url == null || s3Url.isBlank()) {
            return s3Url;
        }

        String s3Host = bucketName + ".s3.ap-northeast-2.amazonaws.com";
        String s3HostAlt = bucketName + ".s3.amazonaws.com";

        if (s3Url.contains(s3Host)) {
            return s3Url.replace(s3Host, cloudfrontDomain);
        }
        if (s3Url.contains(s3HostAlt)) {
            return s3Url.replace(s3HostAlt, cloudfrontDomain);
        }

        return s3Url;
    }

    /**
     * object key로 CloudFront 공개 URL 생성
     * CloudFront 도메인이 설정되지 않은 경우 S3 직접 URL 반환
     *
     * @param objectKey S3 객체 키
     * @return CloudFront 공개 URL 또는 S3 직접 URL
     */
    public String generatePublicUrl(String objectKey) {
        if (isCloudFrontEnabled()) {
            return "https://" + cloudfrontDomain + "/" + objectKey;
        }
        return "https://" + bucketName + ".s3.amazonaws.com/" + objectKey;
    }

    /**
     * URL에서 S3 object key 추출
     * CloudFront URL 또는 S3 URL 모두 지원
     *
     * @param url CloudFront URL 또는 S3 URL
     * @return object key (Optional)
     */
    public Optional<String> extractObjectKeyFromUrl(String url) {
        if (url == null || url.isBlank()) {
            return Optional.empty();
        }

        // CloudFront URL에서 추출
        if (isCloudFrontEnabled() && url.contains(cloudfrontDomain)) {
            int prefixIndex = url.indexOf(cloudfrontDomain);
            int keyStartIndex = prefixIndex + cloudfrontDomain.length() + 1;
            if (keyStartIndex >= url.length()) {
                return Optional.empty();
            }
            return Optional.of(url.substring(keyStartIndex));
        }

        // S3 URL에서 추출 (리전 포함)
        String s3Host = bucketName + ".s3.ap-northeast-2.amazonaws.com/";
        if (url.contains(s3Host)) {
            int prefixIndex = url.indexOf(s3Host);
            int keyStartIndex = prefixIndex + s3Host.length();
            if (keyStartIndex >= url.length()) {
                return Optional.empty();
            }
            return Optional.of(url.substring(keyStartIndex));
        }

        // S3 URL에서 추출 (리전 미포함)
        String s3HostAlt = bucketName + ".s3.amazonaws.com/";
        if (url.contains(s3HostAlt)) {
            int prefixIndex = url.indexOf(s3HostAlt);
            int keyStartIndex = prefixIndex + s3HostAlt.length();
            if (keyStartIndex >= url.length()) {
                return Optional.empty();
            }
            return Optional.of(url.substring(keyStartIndex));
        }

        return Optional.empty();
    }

    /**
     * CloudFront가 활성화되어 있는지 확인
     */
    public boolean isCloudFrontEnabled() {
        return cloudfrontDomain != null && !cloudfrontDomain.isBlank();
    }
}

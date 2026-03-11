package com.coDevs.cohiChat.global.common.file;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.net.URL;
import java.time.Duration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

@ExtendWith(MockitoExtension.class)
class S3PresignedUrlServiceTest {

    @Mock
    private S3Presigner s3Presigner;

    @Mock
    private S3Client s3Client;

    @Mock
    private PresignedGetObjectRequest presignedGetObjectRequest;

    @Mock
    private PresignedPutObjectRequest presignedPutObjectRequest;

    private S3PresignedUrlService s3PresignedUrlService;

    private static final String BUCKET_NAME = "test-bucket";
    private static final String OBJECT_KEY = "2025/01/test-file.pdf";
    private static final String EXPECTED_URL = "https://test-bucket.s3.amazonaws.com/2025/01/test-file.pdf?signature=xxx";

    @BeforeEach
    void setUp() throws Exception {
        s3PresignedUrlService = new S3PresignedUrlService(s3Client, s3Presigner);
        ReflectionTestUtils.setField(s3PresignedUrlService, "bucketName", BUCKET_NAME);
    }

    @Nested
    @DisplayName("다운로드 URL 생성")
    class GenerateDownloadUrl {

        @Test
        @DisplayName("성공: 기본 만료 시간으로 다운로드 URL을 생성한다")
        void generateDownloadUrl_withDefaultExpiration() throws Exception {
            // given
            when(presignedGetObjectRequest.url()).thenReturn(new URL(EXPECTED_URL));
            when(s3Presigner.presignGetObject(any(GetObjectPresignRequest.class)))
                .thenReturn(presignedGetObjectRequest);

            // when
            String url = s3PresignedUrlService.generateDownloadUrl(OBJECT_KEY);

            // then
            assertThat(url).isEqualTo(EXPECTED_URL);
        }

        @Test
        @DisplayName("성공: 지정된 만료 시간으로 다운로드 URL을 생성한다")
        void generateDownloadUrl_withCustomExpiration() throws Exception {
            // given
            Duration customExpiration = Duration.ofMinutes(30);
            when(presignedGetObjectRequest.url()).thenReturn(new URL(EXPECTED_URL));
            when(s3Presigner.presignGetObject(any(GetObjectPresignRequest.class)))
                .thenReturn(presignedGetObjectRequest);

            // when
            String url = s3PresignedUrlService.generateDownloadUrl(OBJECT_KEY, customExpiration);

            // then
            assertThat(url).isEqualTo(EXPECTED_URL);
        }
    }

    @Nested
    @DisplayName("업로드 URL 생성")
    class GenerateUploadUrl {

        @Test
        @DisplayName("성공: 기본 만료 시간으로 업로드 URL을 생성한다")
        void generateUploadUrl_withDefaultExpiration() throws Exception {
            // given
            when(presignedPutObjectRequest.url()).thenReturn(new URL(EXPECTED_URL));
            when(s3Presigner.presignPutObject(any(PutObjectPresignRequest.class)))
                .thenReturn(presignedPutObjectRequest);

            // when
            String url = s3PresignedUrlService.generateUploadUrl(OBJECT_KEY);

            // then
            assertThat(url).isEqualTo(EXPECTED_URL);
        }

        @Test
        @DisplayName("성공: 지정된 만료 시간으로 업로드 URL을 생성한다")
        void generateUploadUrl_withCustomExpiration() throws Exception {
            // given
            Duration customExpiration = Duration.ofMinutes(30);
            when(presignedPutObjectRequest.url()).thenReturn(new URL(EXPECTED_URL));
            when(s3Presigner.presignPutObject(any(PutObjectPresignRequest.class)))
                .thenReturn(presignedPutObjectRequest);

            // when
            String url = s3PresignedUrlService.generateUploadUrl(OBJECT_KEY, customExpiration);

            // then
            assertThat(url).isEqualTo(EXPECTED_URL);
        }

        @Test
        @DisplayName("성공: Content-Type을 지정하여 업로드 URL을 생성한다")
        void generateUploadUrl_withContentType() throws Exception {
            // given
            Duration customExpiration = Duration.ofMinutes(30);
            String contentType = "application/pdf";
            when(presignedPutObjectRequest.url()).thenReturn(new URL(EXPECTED_URL));
            when(s3Presigner.presignPutObject(any(PutObjectPresignRequest.class)))
                .thenReturn(presignedPutObjectRequest);

            // when
            String url = s3PresignedUrlService.generateUploadUrl(OBJECT_KEY, customExpiration, contentType);

            // then
            assertThat(url).isEqualTo(EXPECTED_URL);
        }

        @Test
        @DisplayName("성공: Content-Type이 null이어도 업로드 URL을 생성한다")
        void generateUploadUrl_withNullContentType() throws Exception {
            // given
            Duration customExpiration = Duration.ofMinutes(30);
            when(presignedPutObjectRequest.url()).thenReturn(new URL(EXPECTED_URL));
            when(s3Presigner.presignPutObject(any(PutObjectPresignRequest.class)))
                .thenReturn(presignedPutObjectRequest);

            // when
            String url = s3PresignedUrlService.generateUploadUrl(OBJECT_KEY, customExpiration, null);

            // then
            assertThat(url).isEqualTo(EXPECTED_URL);
        }

        @Test
        @DisplayName("성공: Content-Type이 빈 문자열이어도 업로드 URL을 생성한다")
        void generateUploadUrl_withBlankContentType() throws Exception {
            // given
            Duration customExpiration = Duration.ofMinutes(30);
            when(presignedPutObjectRequest.url()).thenReturn(new URL(EXPECTED_URL));
            when(s3Presigner.presignPutObject(any(PutObjectPresignRequest.class)))
                .thenReturn(presignedPutObjectRequest);

            // when
            String url = s3PresignedUrlService.generateUploadUrl(OBJECT_KEY, customExpiration, "   ");

            // then
            assertThat(url).isEqualTo(EXPECTED_URL);
        }
    }
}

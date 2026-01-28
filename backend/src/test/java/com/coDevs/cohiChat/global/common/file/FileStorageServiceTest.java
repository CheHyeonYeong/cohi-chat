package com.coDevs.cohiChat.global.common.file;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import com.coDevs.cohiChat.global.common.file.serviceImpl.LocalFileStorageServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;

class FileStorageServiceTest {

    private FileStorageService fileStorageService;
    private Path tempDir;

    @BeforeEach
    void setUp() throws IOException {
        tempDir = Files.createTempDirectory("test-uploads");
        fileStorageService = new LocalFileStorageServiceImpl(tempDir.toString());
    }

    @AfterEach
    void tearDown() throws IOException {
        Files.walk(tempDir)
            .sorted((a, b) -> -a.compareTo(b))
            .forEach(path -> {
                try {
                    Files.deleteIfExists(path);
                } catch (IOException e) {
                    // ignore
                }
            });
    }

    @Test
    @DisplayName("성공: 파일을 저장할 수 있다")
    void storeFileSuccess() {
        // given
        MultipartFile file = new MockMultipartFile(
            "file",
            "test.pdf",
            "application/pdf",
            "test content".getBytes()
        );

        // when
        FileStorageResult result = fileStorageService.store(file);

        // then
        assertThat(result.fileName()).isNotNull();
        assertThat(result.fileName()).endsWith(".pdf");
        assertThat(result.filePath()).contains(result.fileName());
        assertThat(result.fileSize()).isEqualTo(file.getSize());
        assertThat(result.contentType()).isEqualTo("application/pdf");

        // verify file exists
        Path storedFile = Path.of(result.filePath());
        assertThat(Files.exists(storedFile)).isTrue();
    }

    @Test
    @DisplayName("성공: 확장자가 없는 파일도 저장할 수 있다")
    void storeFileWithoutExtension() {
        // given
        MultipartFile file = new MockMultipartFile(
            "file",
            "noextension",
            "application/octet-stream",
            "test content".getBytes()
        );

        // when
        FileStorageResult result = fileStorageService.store(file);

        // then
        assertThat(result.fileName()).isNotNull();
        assertThat(result.fileName()).doesNotContain(".");
    }

    @Test
    @DisplayName("실패: 빈 파일은 저장할 수 없다")
    void storeEmptyFileFails() {
        // given
        MultipartFile file = new MockMultipartFile(
            "file",
            "empty.pdf",
            "application/pdf",
            new byte[0]
        );

        // when & then
        assertThatThrownBy(() -> fileStorageService.store(file))
            .isInstanceOf(CustomException.class)
            .extracting(e -> ((CustomException) e).getErrorCode())
            .isEqualTo(ErrorCode.FILE_EMPTY);
    }

    @Test
    @DisplayName("성공: 파일을 삭제할 수 있다")
    void deleteFileSuccess() throws IOException {
        // given
        MultipartFile file = new MockMultipartFile(
            "file",
            "test.pdf",
            "application/pdf",
            "test content".getBytes()
        );
        FileStorageResult result = fileStorageService.store(file);
        Path storedFile = Path.of(result.filePath());
        assertThat(Files.exists(storedFile)).isTrue();

        // when
        fileStorageService.delete(result.filePath());

        // then
        assertThat(Files.exists(storedFile)).isFalse();
    }

    @Test
    @DisplayName("성공: 존재하지 않는 파일 삭제 시 예외 없음")
    void deleteNonExistentFileNoException() {
        // when & then
        fileStorageService.delete("/nonexistent/path/file.pdf");
        // no exception should be thrown
    }

    @Test
    @DisplayName("성공: 파일을 로드할 수 있다")
    void loadFileSuccess() throws IOException {
        // given
        byte[] content = "test content".getBytes();
        MultipartFile file = new MockMultipartFile(
            "file",
            "test.pdf",
            "application/pdf",
            content
        );
        FileStorageResult result = fileStorageService.store(file);

        // when
        byte[] loadedContent = fileStorageService.load(result.filePath());

        // then
        assertThat(loadedContent).isEqualTo(content);
    }

    @Test
    @DisplayName("실패: 존재하지 않는 파일 로드 시 예외 발생")
    void loadNonExistentFileFails() {
        // when & then
        assertThatThrownBy(() -> fileStorageService.load("/nonexistent/path/file.pdf"))
            .isInstanceOf(CustomException.class)
            .extracting(e -> ((CustomException) e).getErrorCode())
            .isEqualTo(ErrorCode.FILE_NOT_FOUND);
    }
}

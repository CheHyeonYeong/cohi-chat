package com.coDevs.cohiChat.global.common.file.serviceImpl;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

import com.coDevs.cohiChat.global.common.file.FileStorageResult;
import com.coDevs.cohiChat.global.common.file.FileStorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;

@Service
public class LocalFileStorageServiceImpl implements FileStorageService {

    private final Path rootLocation;

    public LocalFileStorageServiceImpl(@Value("${file.upload-dir:./uploads}") String uploadDir) {
        this.rootLocation = Path.of(uploadDir);
        init();
    }

    private void init() {
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new CustomException(ErrorCode.FILE_STORAGE_ERROR);
        }
    }

    @Override
    public FileStorageResult store(MultipartFile file) {
        if (file.isEmpty()) {
            throw new CustomException(ErrorCode.FILE_EMPTY);
        }

        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
        String extension = getExtension(originalFileName);
        String storedFileName = UUID.randomUUID().toString() + extension;

        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
        Path targetDir = rootLocation.resolve(datePath);

        try {
            Files.createDirectories(targetDir);
            Path targetPath = targetDir.resolve(storedFileName);
            try (var inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
            }

            return new FileStorageResult(
                storedFileName,
                targetPath.toString(),
                file.getSize(),
                file.getContentType() != null ? file.getContentType() : "application/octet-stream"
            );
        } catch (IOException e) {
            throw new CustomException(ErrorCode.FILE_STORAGE_ERROR);
        }
    }

    @Override
    public void delete(String filePath) {
        try {
            Path path = Path.of(filePath);
            Files.deleteIfExists(path);
        } catch (IOException e) {
            // 로컬 파일 삭제 실패는 무시 - 고아 파일은 배치로 정리 가능
        }
    }

    @Override
    public byte[] load(String filePath) {
        Path path = Path.of(filePath);
        if (!Files.exists(path)) {
            throw new CustomException(ErrorCode.FILE_NOT_FOUND);
        }
        try {
            return Files.readAllBytes(path);
        } catch (IOException e) {
            throw new CustomException(ErrorCode.FILE_STORAGE_ERROR);
        }
    }

    private String getExtension(String fileName) {
        int lastDot = fileName.lastIndexOf('.');
        if (lastDot > 0 && lastDot < fileName.length() - 1) {
            return "." + fileName.substring(lastDot + 1);
        }
        return "";
    }
}

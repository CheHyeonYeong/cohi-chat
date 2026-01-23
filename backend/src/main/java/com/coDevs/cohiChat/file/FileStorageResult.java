package com.coDevs.cohiChat.file;

public record FileStorageResult(
    String fileName,
    String filePath,
    Long fileSize,
    String contentType
) {
}

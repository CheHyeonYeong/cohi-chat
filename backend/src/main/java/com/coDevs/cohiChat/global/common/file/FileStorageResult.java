package com.coDevs.cohiChat.global.common.file;

public record FileStorageResult(
    String fileName,
    String filePath,
    Long fileSize,
    String contentType
) {
}

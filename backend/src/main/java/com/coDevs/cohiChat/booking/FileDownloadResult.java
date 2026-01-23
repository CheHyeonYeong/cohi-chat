package com.coDevs.cohiChat.booking;

public record FileDownloadResult(
    byte[] content,
    String originalFileName,
    String contentType
) {
}

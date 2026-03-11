package com.coDevs.cohiChat.booking.response;

public record PresignedDownloadUrlResponseDTO(
    String url,
    int expiresIn
) {
    public static PresignedDownloadUrlResponseDTO of(String url, int expiresIn) {
        return new PresignedDownloadUrlResponseDTO(url, expiresIn);
    }
}

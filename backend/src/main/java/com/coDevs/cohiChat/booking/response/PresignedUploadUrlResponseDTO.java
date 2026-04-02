package com.coDevs.cohiChat.booking.response;

public record PresignedUploadUrlResponseDTO(
    String url,
    String objectKey,
    int expiresIn,
    String contentType
) {
    public static PresignedUploadUrlResponseDTO of(String url, String objectKey, int expiresIn, String contentType) {
        return new PresignedUploadUrlResponseDTO(url, objectKey, expiresIn, contentType);
    }
}

package com.coDevs.cohiChat.booking.response;

public record PresignedUploadUrlResponseDTO(
    String url,
    String objectKey,
    int expiresIn
) {
    public static PresignedUploadUrlResponseDTO of(String url, String objectKey, int expiresIn) {
        return new PresignedUploadUrlResponseDTO(url, objectKey, expiresIn);
    }
}

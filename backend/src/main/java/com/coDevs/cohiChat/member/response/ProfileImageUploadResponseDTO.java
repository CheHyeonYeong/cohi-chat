package com.coDevs.cohiChat.member.response;

public record ProfileImageUploadResponseDTO(
    String uploadUrl,
    String objectKey,
    String contentType
) {
    public static ProfileImageUploadResponseDTO of(String uploadUrl, String objectKey, String contentType) {
        return new ProfileImageUploadResponseDTO(uploadUrl, objectKey, contentType);
    }
}

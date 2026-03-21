package com.coDevs.cohiChat.member.response;

public record ProfileImageUploadResponseDTO(
    String uploadUrl,
    String objectKey
) {
    public static ProfileImageUploadResponseDTO of(String uploadUrl, String objectKey) {
        return new ProfileImageUploadResponseDTO(uploadUrl, objectKey);
    }
}

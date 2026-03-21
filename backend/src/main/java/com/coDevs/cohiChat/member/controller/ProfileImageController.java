package com.coDevs.cohiChat.member.controller;

import java.security.Principal;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coDevs.cohiChat.global.response.ApiResponseDTO;
import com.coDevs.cohiChat.member.ProfileImageService;
import com.coDevs.cohiChat.member.request.ProfileImageConfirmRequestDTO;
import com.coDevs.cohiChat.member.request.ProfileImageUploadRequestDTO;
import com.coDevs.cohiChat.member.response.ProfileImageUploadResponseDTO;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/members/v1/me/profile-image")
@RequiredArgsConstructor
@Tag(name = "Profile Image", description = "프로필 이미지 관련 API")
public class ProfileImageController {

    private final ProfileImageService profileImageService;

    @Operation(summary = "프로필 이미지 업로드 URL 생성", description = "S3 Presigned URL을 생성하여 클라이언트가 직접 업로드할 수 있게 합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Presigned URL 생성 성공"),
        @ApiResponse(responseCode = "400", description = "파일 검증 실패 (크기 초과, 허용되지 않은 형식)"),
        @ApiResponse(responseCode = "401", description = "인증 필요")
    })
    @PostMapping("/presigned-url")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponseDTO<ProfileImageUploadResponseDTO>> generatePresignedUrl(
            @Valid @RequestBody ProfileImageUploadRequestDTO request,
            Principal principal) {

        ProfileImageUploadResponseDTO response = profileImageService.generatePresignedUploadUrl(
                principal.getName(),
                request.getFileName(),
                request.getContentType(),
                request.getFileSize()
        );

        return ResponseEntity.ok(ApiResponseDTO.success(response));
    }

    @Operation(summary = "프로필 이미지 업로드 확인", description = "S3에 업로드된 이미지를 확인하고 프로필에 적용합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "업로드 확인 및 프로필 적용 성공"),
        @ApiResponse(responseCode = "400", description = "파일 검증 실패"),
        @ApiResponse(responseCode = "401", description = "인증 필요"),
        @ApiResponse(responseCode = "404", description = "파일을 찾을 수 없음")
    })
    @PostMapping("/confirm")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponseDTO<String>> confirmUpload(
            @Valid @RequestBody ProfileImageConfirmRequestDTO request,
            Principal principal) {

        String profileImageUrl = profileImageService.confirmUpload(
                principal.getName(),
                request.getObjectKey()
        );

        return ResponseEntity.ok(ApiResponseDTO.success(profileImageUrl));
    }

    @Operation(summary = "프로필 이미지 삭제", description = "현재 프로필 이미지를 삭제합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "삭제 성공"),
        @ApiResponse(responseCode = "401", description = "인증 필요")
    })
    @DeleteMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteProfileImage(Principal principal) {
        profileImageService.deleteProfileImage(principal.getName());
        return ResponseEntity.noContent().build();
    }
}

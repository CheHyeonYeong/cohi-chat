package com.coDevs.cohiChat.booking.controller;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.coDevs.cohiChat.booking.BookingFileService;
import com.coDevs.cohiChat.booking.FileDownloadResult;
import com.coDevs.cohiChat.booking.response.BookingFileResponseDTO;
import com.coDevs.cohiChat.member.MemberService;
import com.coDevs.cohiChat.member.entity.Member;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@Tag(name = "Booking File", description = "예약 파일 관리 API")
@RestController
@RequestMapping("/bookings/{bookingId}/files")
@RequiredArgsConstructor
public class BookingFileController {

    private final BookingFileService bookingFileService;
    private final MemberService memberService;

    @Operation(summary = "파일 업로드", description = "예약에 파일을 업로드합니다. 게스트 또는 호스트만 업로드 가능합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "파일 업로드 성공"),
        @ApiResponse(responseCode = "400", description = "빈 파일"),
        @ApiResponse(responseCode = "401", description = "인증 필요"),
        @ApiResponse(responseCode = "403", description = "접근 권한 없음"),
        @ApiResponse(responseCode = "404", description = "예약을 찾을 수 없음")
    })
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BookingFileResponseDTO> uploadFile(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long bookingId,
            @RequestParam("file") MultipartFile file
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        BookingFileResponseDTO response = bookingFileService.uploadFile(bookingId, member.getId(), file);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "파일 목록 조회", description = "예약에 첨부된 파일 목록을 조회합니다. 게스트 또는 호스트만 조회 가능합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "401", description = "인증 필요"),
        @ApiResponse(responseCode = "403", description = "접근 권한 없음"),
        @ApiResponse(responseCode = "404", description = "예약을 찾을 수 없음")
    })
    @GetMapping
    public ResponseEntity<List<BookingFileResponseDTO>> getFiles(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long bookingId
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        List<BookingFileResponseDTO> responses = bookingFileService.getFiles(bookingId, member.getId());
        return ResponseEntity.ok(responses);
    }

    @Operation(summary = "파일 삭제", description = "예약에 첨부된 파일을 삭제합니다. 게스트 또는 호스트만 삭제 가능합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "삭제 성공"),
        @ApiResponse(responseCode = "401", description = "인증 필요"),
        @ApiResponse(responseCode = "403", description = "접근 권한 없음"),
        @ApiResponse(responseCode = "404", description = "예약 또는 파일을 찾을 수 없음")
    })
    @DeleteMapping("/{fileId}")
    public ResponseEntity<Void> deleteFile(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long bookingId,
            @PathVariable Long fileId
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        bookingFileService.deleteFile(bookingId, fileId, member.getId());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "파일 다운로드", description = "예약에 첨부된 파일을 다운로드합니다. 게스트 또는 호스트만 다운로드 가능합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "다운로드 성공"),
        @ApiResponse(responseCode = "401", description = "인증 필요"),
        @ApiResponse(responseCode = "403", description = "접근 권한 없음"),
        @ApiResponse(responseCode = "404", description = "예약 또는 파일을 찾을 수 없음")
    })
    @GetMapping("/{fileId}/download")
    public ResponseEntity<byte[]> downloadFile(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long bookingId,
            @PathVariable Long fileId
    ) {
        Member member = memberService.getMember(userDetails.getUsername());
        FileDownloadResult result = bookingFileService.downloadFile(bookingId, fileId, member.getId());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(result.contentType()));
        headers.setContentDispositionFormData("attachment", result.originalFileName());

        return new ResponseEntity<>(result.content(), headers, HttpStatus.OK);
    }
}

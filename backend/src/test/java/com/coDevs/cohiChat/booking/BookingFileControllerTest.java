package com.coDevs.cohiChat.booking;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.multipart.MultipartFile;

import com.coDevs.cohiChat.booking.controller.BookingFileController;
import com.coDevs.cohiChat.booking.response.BookingFileResponseDTO;
import com.coDevs.cohiChat.global.exception.CustomException;
import com.coDevs.cohiChat.global.exception.ErrorCode;
import com.coDevs.cohiChat.global.security.jwt.JwtTokenProvider;
import com.coDevs.cohiChat.member.MemberService;
import com.coDevs.cohiChat.member.entity.Member;
import com.coDevs.cohiChat.member.entity.Role;

@WebMvcTest(BookingFileController.class)
@AutoConfigureMockMvc
@WithMockUser(username = "guest")
class BookingFileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private BookingFileService bookingFileService;

    @MockitoBean
    private MemberService memberService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    private Member mockMember;

    private static final UUID USER_ID = UUID.randomUUID();
    private static final Long BOOKING_ID = 1L;
    private static final Long FILE_ID = 1L;

    @BeforeEach
    void setUp() {
        mockMember = mock(Member.class);
        given(mockMember.getId()).willReturn(USER_ID);
        given(mockMember.getRole()).willReturn(Role.GUEST);
        given(memberService.getMember(any())).willReturn(mockMember);
    }

    @Nested
    @DisplayName("파일 업로드")
    class UploadFile {

        @Test
        @DisplayName("성공: 파일 업로드 - 201 Created")
        void uploadFileSuccess() throws Exception {
            // given
            MockMultipartFile file = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", "content".getBytes()
            );

            BookingFileResponseDTO response = new BookingFileResponseDTO(
                FILE_ID, BOOKING_ID, "uuid-file.pdf", "resume.pdf",
                7L, "application/pdf", LocalDateTime.now()
            );

            given(bookingFileService.uploadFile(eq(BOOKING_ID), eq(USER_ID), any(MultipartFile.class)))
                .willReturn(response);

            // when & then
            mockMvc.perform(multipart("/bookings/{bookingId}/files", BOOKING_ID)
                    .file(file)
                    .with(csrf()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(FILE_ID))
                .andExpect(jsonPath("$.data.originalFileName").value("resume.pdf"))
                .andExpect(jsonPath("$.error").isEmpty());
        }

        @Test
        @DisplayName("실패: 예약을 찾을 수 없음 - 404")
        void uploadFileFailsWhenBookingNotFound() throws Exception {
            // given
            MockMultipartFile file = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", "content".getBytes()
            );

            given(bookingFileService.uploadFile(eq(BOOKING_ID), eq(USER_ID), any(MultipartFile.class)))
                .willThrow(new CustomException(ErrorCode.BOOKING_NOT_FOUND));

            // when & then
            mockMvc.perform(multipart("/bookings/{bookingId}/files", BOOKING_ID)
                    .file(file)
                    .with(csrf()))
                .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("실패: 접근 권한 없음 - 403")
        void uploadFileFailsWhenAccessDenied() throws Exception {
            // given
            MockMultipartFile file = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", "content".getBytes()
            );

            given(bookingFileService.uploadFile(eq(BOOKING_ID), eq(USER_ID), any(MultipartFile.class)))
                .willThrow(new CustomException(ErrorCode.ACCESS_DENIED));

            // when & then
            mockMvc.perform(multipart("/bookings/{bookingId}/files", BOOKING_ID)
                    .file(file)
                    .with(csrf()))
                .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("파일 목록 조회")
    class GetFiles {

        @Test
        @DisplayName("성공: 파일 목록 조회 - 200 OK")
        void getFilesSuccess() throws Exception {
            // given
            List<BookingFileResponseDTO> responses = List.of(
                new BookingFileResponseDTO(
                    FILE_ID, BOOKING_ID, "uuid-file.pdf", "resume.pdf",
                    1024L, "application/pdf", LocalDateTime.now()
                )
            );

            given(bookingFileService.getFiles(BOOKING_ID, USER_ID)).willReturn(responses);

            // when & then
            mockMvc.perform(get("/bookings/{bookingId}/files", BOOKING_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(FILE_ID))
                .andExpect(jsonPath("$.data[0].originalFileName").value("resume.pdf"))
                .andExpect(jsonPath("$.error").isEmpty());
        }

        @Test
        @DisplayName("실패: 접근 권한 없음 - 403")
        void getFilesFailsWhenAccessDenied() throws Exception {
            // given
            given(bookingFileService.getFiles(BOOKING_ID, USER_ID))
                .willThrow(new CustomException(ErrorCode.ACCESS_DENIED));

            // when & then
            mockMvc.perform(get("/bookings/{bookingId}/files", BOOKING_ID))
                .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("파일 삭제")
    class DeleteFile {

        @Test
        @DisplayName("성공: 파일 삭제 - 204 No Content")
        void deleteFileSuccess() throws Exception {
            // given
            doNothing().when(bookingFileService).deleteFile(BOOKING_ID, FILE_ID, USER_ID);

            // when & then
            mockMvc.perform(delete("/bookings/{bookingId}/files/{fileId}", BOOKING_ID, FILE_ID)
                    .with(csrf()))
                .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("실패: 파일을 찾을 수 없음 - 404")
        void deleteFileFailsWhenFileNotFound() throws Exception {
            // given
            doThrow(new CustomException(ErrorCode.FILE_NOT_FOUND))
                .when(bookingFileService).deleteFile(BOOKING_ID, FILE_ID, USER_ID);

            // when & then
            mockMvc.perform(delete("/bookings/{bookingId}/files/{fileId}", BOOKING_ID, FILE_ID)
                    .with(csrf()))
                .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("파일 다운로드")
    class DownloadFile {

        @Test
        @DisplayName("성공: 파일 다운로드 - 200 OK")
        void downloadFileSuccess() throws Exception {
            // given
            byte[] content = "file content".getBytes();
            FileDownloadResult result = new FileDownloadResult(content, "resume.pdf", "application/pdf");

            given(bookingFileService.downloadFile(BOOKING_ID, FILE_ID, USER_ID)).willReturn(result);

            // when & then
            mockMvc.perform(get("/bookings/{bookingId}/files/{fileId}/download", BOOKING_ID, FILE_ID))
                .andExpect(status().isOk())
                .andExpect(content().bytes(content))
                .andExpect(header().string("Content-Type", "application/pdf"));
        }

        @Test
        @DisplayName("실패: 파일을 찾을 수 없음 - 404")
        void downloadFileFailsWhenFileNotFound() throws Exception {
            // given
            given(bookingFileService.downloadFile(BOOKING_ID, FILE_ID, USER_ID))
                .willThrow(new CustomException(ErrorCode.FILE_NOT_FOUND));

            // when & then
            mockMvc.perform(get("/bookings/{bookingId}/files/{fileId}/download", BOOKING_ID, FILE_ID))
                .andExpect(status().isNotFound());
        }
    }
}

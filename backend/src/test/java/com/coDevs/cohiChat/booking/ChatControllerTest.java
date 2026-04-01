package com.coDevs.cohiChat.booking;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.coDevs.cohiChat.booking.controller.ChatController;
import com.coDevs.cohiChat.chat.response.ChatReadStateResponseDTO;
import com.coDevs.cohiChat.chat.response.ChatRoomResponseDTO;
import com.coDevs.cohiChat.chat.service.ChatService;
import com.coDevs.cohiChat.global.security.jwt.JwtTokenProvider;
import com.coDevs.cohiChat.member.MemberService;
import com.coDevs.cohiChat.member.entity.Member;

@WebMvcTest(ChatController.class)
@AutoConfigureMockMvc
@WithMockUser(username = "guest")
class ChatControllerTest {

    private static final Long BOOKING_ID = 1L;
    private static final UUID MEMBER_ID = UUID.randomUUID();
    private static final UUID ROOM_ID = UUID.randomUUID();
    private static final UUID MESSAGE_ID = UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ChatService chatService;

    @MockitoBean
    private MemberService memberService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    private Member mockMember;

    @BeforeEach
    void setUp() {
        mockMember = org.mockito.Mockito.mock(Member.class);
        given(mockMember.getId()).willReturn(MEMBER_ID);
        given(memberService.getMember(any())).willReturn(mockMember);
    }

    @Test
    @DisplayName("returns chat room id for an authenticated booking participant")
    void getChatRoomSuccess() throws Exception {
        given(chatService.getChatRoomByBookingId(BOOKING_ID, MEMBER_ID))
            .willReturn(new ChatRoomResponseDTO(ROOM_ID));

        mockMvc.perform(get("/bookings/{bookingId}/chat-room", BOOKING_ID))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.roomId").value(ROOM_ID.toString()));
    }

    @Test
    @DisplayName("updates last read message id")
    void updateChatReadStateSuccess() throws Exception {
        given(chatService.updateLastReadMessageId(BOOKING_ID, MEMBER_ID, MESSAGE_ID))
            .willReturn(new ChatReadStateResponseDTO(ROOM_ID, MESSAGE_ID));

        mockMvc.perform(patch("/bookings/{bookingId}/chat-room/read", BOOKING_ID)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "messageId": "%s"
                    }
                    """.formatted(MESSAGE_ID)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.roomId").value(ROOM_ID.toString()))
            .andExpect(jsonPath("$.data.lastReadMessageId").value(MESSAGE_ID.toString()));
    }
}

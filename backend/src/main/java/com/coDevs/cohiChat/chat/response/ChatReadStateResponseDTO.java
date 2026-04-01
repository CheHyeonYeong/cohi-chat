package com.coDevs.cohiChat.chat.response;

import java.util.UUID;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Stored chat read state for the current room member")
public record ChatReadStateResponseDTO(
    @Schema(description = "Chat room ID", example = "550e8400-e29b-41d4-a716-446655440000")
    UUID roomId,
    @Schema(description = "Last read message ID", example = "550e8400-e29b-41d4-a716-446655440000")
    UUID lastReadMessageId
) {
}

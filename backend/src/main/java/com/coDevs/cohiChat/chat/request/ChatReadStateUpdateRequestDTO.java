package com.coDevs.cohiChat.chat.request;

import java.util.UUID;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Schema(description = "Request to store the last read chat message ID")
public class ChatReadStateUpdateRequestDTO {

    @NotNull(message = "messageId???꾩닔 ?낅젰 ??ぉ?낅땲??")
    @Schema(description = "Last read message ID", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID messageId;
}

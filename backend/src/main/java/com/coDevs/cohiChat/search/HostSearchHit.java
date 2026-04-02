package com.coDevs.cohiChat.search;

import java.util.UUID;

public record HostSearchHit(
    UUID hostId,
    double similarity
) {
}

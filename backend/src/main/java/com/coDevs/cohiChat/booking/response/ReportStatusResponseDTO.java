package com.coDevs.cohiChat.booking.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ReportStatusResponseDTO {
    private final boolean reportedHost;
    private final boolean reportedGuest;
}

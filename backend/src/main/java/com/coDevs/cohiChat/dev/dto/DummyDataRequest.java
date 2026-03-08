package com.coDevs.cohiChat.dev.dto;

public record DummyDataRequest(
    int memberCount,
    int hostCount,
    int timeSlotCount,
    int bookingCount
) {
    public DummyDataRequest {
        if (memberCount < 0) memberCount = 5;
        if (hostCount < 0) hostCount = 2;
        if (timeSlotCount < 0) timeSlotCount = 10;
        if (bookingCount < 0) bookingCount = 5;
    }

    public static DummyDataRequest defaults() {
        return new DummyDataRequest(5, 2, 10, 5);
    }
}

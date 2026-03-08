package com.coDevs.cohiChat.dev.dto;

public record DummyDataResponse(
    int membersCreated,
    int hostsCreated,
    int timeSlotsCreated,
    int bookingsCreated
) {
    public static DummyDataResponse of(int members, int hosts, int timeSlots, int bookings) {
        return new DummyDataResponse(members, hosts, timeSlots, bookings);
    }
}

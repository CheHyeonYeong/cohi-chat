export const bookingKeys = {
    myBookingsAll: () => ['my-bookings'] as const,
    myBookings: (page?: number, pageSize?: number, username: string | null = null) =>
        ['my-bookings', username, page, pageSize] as const,
    booking: (id: number, username: string | null = null) =>
        ['booking', id, username] as const,
    noShowHistory: (hostId: string) => ['noshow-history', hostId] as const,
};

export const calendarKeys = {
    bookings: (year: number, month: number) => ['bookings', year, month] as const,
    timeslots: (hostname: string, hostId?: string) => ['timeslots', hostname, hostId] as const,
    calendarEvent: (slug: string) => ['calendar-event', slug] as const,
};

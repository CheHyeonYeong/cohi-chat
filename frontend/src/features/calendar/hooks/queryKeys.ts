export const calendarKeys = {
    bookings: (year: number, month: number) => ['bookings', year, month] as const,
    myBookingsAll: () => ['my-bookings'] as const,
    myBookings: (page?: number, pageSize?: number, username?: string | null) =>
        username == null
            ? ['my-bookings', page, pageSize] as const
            : ['my-bookings', username, page, pageSize] as const,
    booking: (id: number, username?: string | null) =>
        username == null
            ? ['booking', id] as const
            : ['booking', id, username] as const,
    timeslots: (hostname: string, hostId?: string) => ['timeslots', hostname, hostId] as const,
    calendarEvent: (slug: string) => ['calendar-event', slug] as const,
    noShowHistory: (hostId: string) => ['noshow-history', hostId] as const,
};

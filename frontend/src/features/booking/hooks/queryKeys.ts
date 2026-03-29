export const bookingKeys = {
    myBookingsAll: () => ['my-bookings'] as const,
    myBookings: (page?: number, pageSize?: number, username: string = '') =>
        ['my-bookings', username, page, pageSize] as const,
    allMyBookingsAll: () => ['all-my-bookings'] as const,
    allMyBookings: (page?: number, pageSize?: number) => ['all-my-bookings', page, pageSize] as const,
    bookingAll: () => ['booking'] as const,
    booking: (id: number, username: string | null = null) =>
        ['booking', id, username] as const,
    noShowHistory: (hostId: string) => ['noshow-history', hostId] as const,
};

export const calendarKeys = {
    bookingsAll: () => ['bookings'] as const,
    bookings: (hostname: string, year: number, month: number) =>
        ['bookings', hostname, year, month] as const,
    timeslots: (hostname: string, hostId?: string) => ['timeslots', hostname, hostId] as const,
    calendarEvent: (slug: string) => ['calendar-event', slug] as const,
};

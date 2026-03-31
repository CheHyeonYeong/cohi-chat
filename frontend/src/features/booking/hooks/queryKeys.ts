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
    bookings: (username: string, year: number, month: number) =>
        ['bookings', username, year, month] as const,
    timeslots: (username: string, hostId?: string) => ['timeslots', username, hostId] as const,
    calendarEvent: (username: string) => ['calendar-event', username] as const,
};

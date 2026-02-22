export const calendarKeys = {
    bookings: (year: number, month: number) => ['bookings', year, month] as const,
    myBookings: (page?: number, pageSize?: number) => ['my-bookings', page, pageSize] as const,
    booking: (id: number) => ['booking', id] as const,
    timeslots: (hostname: string, hostId?: string) => ['timeslots', hostname, hostId] as const,
    calendarEvent: (slug: string) => ['calendar-event', slug] as const,
    noShowHistory: (hostId: string) => ['noshow-history', hostId] as const,
};

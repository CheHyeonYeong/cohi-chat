export const hostKeys = {
    all: () => ['hosts'] as const,
    search: (query: string) => ['hosts', 'search', query] as const,
    myCalendar: () => ['host', 'my-calendar'] as const,
    myTimeslots: () => ['host', 'my-timeslots'] as const,
    serviceAccountEmail: () => ['host', 'service-account-email'] as const,
};

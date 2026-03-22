export const authKeys = {
    all: () => ['auth'] as const,
    current: () => [...authKeys.all(), 'me'] as const,
};

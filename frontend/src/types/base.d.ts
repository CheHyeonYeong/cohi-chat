export type UID = string;

export type StringTime = `${number}:${number}`;

export type ISO8601String = `${number}-${number}-${number}T${number}:${number}:${number}Z`;

/** ISO 8601 full datetime with timezone offset, e.g. "2026-02-13T09:00:00+09:00" */
export type ISO8601DateTimeString = string;

export type DateString = `${number}-${string}-${string}`;

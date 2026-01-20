import { ISO8601String, StringTime } from "./base";

export interface ITimeSlot {
    id: number;
    userId: string;
    startTime: StringTime;
    endTime: StringTime;
    weekdays: number[];
    createdAt: ISO8601String;
    updatedAt: ISO8601String;
}
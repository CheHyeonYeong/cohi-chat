export const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

export const getCalendarDays = (date: Date): number[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = getDaysInMonth(date);

    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days: number[] = Array(firstDayOfMonth).fill(0);

    for (let day = 1; day <= daysInMonth; day++) {
        days.push(day);
    }

    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
        days.push(...Array(remainingDays).fill(0));
    }

    return days;
};

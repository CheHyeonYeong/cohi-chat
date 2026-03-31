import type { ButtonHTMLAttributes } from "react";
import { cn } from "~/libs/cn";

interface NavigatorProps {
    username: string;
    year: number;
    month: number;
    baseDate?: Date;
    onPrevious: (username: string, date: { year: number; month: number }) => void;
    onNext: (username: string, date: { year: number; month: number }) => void;
}

export const Navigator = ({ username, year, month, baseDate, onPrevious, onNext }: NavigatorProps) => {
    const now = baseDate ?? new Date();
    const isPast = year < now.getFullYear() || (year === now.getFullYear() && month <= now.getMonth() + 1);

    const handlePrevious = () => {
        if (isPast) return;

        if (month === 1) {
            onPrevious(username, { year: year - 1, month: 12 });
        } else {
            onPrevious(username, { year, month: month - 1 });
        }
    };

    const handleNext = () => {
        if (month === 12) {
            onNext(username, { year: year + 1, month: 1 });
        } else {
            onNext(username, { year, month: month + 1 });
        }
    };

    return (
        <div className={cn("w-full flex justify-center items-center space-x-5")}>
            <NavigatorButton
                role="button"
                role-label="button-이전달"
                disabled={isPast}
                onClick={handlePrevious}
            >
                &lt;
            </NavigatorButton>

            <h3 role="label" role-label="year-month" className="text-xl font-semibold">{year}년 {month}월</h3>

            <NavigatorButton
                role="button"
                role-label="button-다음달"
                onClick={handleNext}
            >
                &gt;
            </NavigatorButton>
        </div>
    );
};

const NavigatorButton = (props: ButtonHTMLAttributes<HTMLButtonElement>) => {
    const { className, disabled, ...rest } = props;
    return (
        <button
            className={cn([
                'w-8 h-8 rounded-full flex items-center justify-center select-none',
                { 'font-bold text-primary hover:text-white hover:bg-primary': !disabled },
                { 'cursor-default text-gray-500 hover:text-gray-500 hover:bg-inherit hover:border-transparent': disabled },
                className,
            ])}
            {...rest}
        />
    );
};

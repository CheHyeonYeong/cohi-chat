import { useNavigate } from '@tanstack/react-router';

export function useCalendarNavigation() {
    const navigate = useNavigate();

    const handlePrevious = async (slug: string, date: { year: number; month: number }) => {
        navigate({
            to: '/app/calendar/$slug',
            params: { slug },
            search: { year: date.year, month: date.month },
        });
    };

    const handleNext = async (slug: string, date: { year: number; month: number }) => {
        navigate({
            to: '/app/calendar/$slug',
            params: { slug },
            search: { year: date.year, month: date.month },
        });
    };

    return { handlePrevious, handleNext };
}

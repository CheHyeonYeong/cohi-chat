import React from 'react';
import { Button } from '~/components/button';

interface PaginationProps {
    page: number;
    pageSize: number;
    totalCount: number;
    onPageChange: (newPage: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ page, pageSize, totalCount, onPageChange }) => {
    const totalPages = Math.ceil(totalCount / pageSize);

    const handlePrevious = () => {
        if (page > 1) {
            onPageChange(page - 1);
        }
    };

    const handleNext = () => {
        if (page < totalPages) {
            onPageChange(page + 1);
        }
    };

    return (
        <div className="flex justify-between items-center mt-4">
            <Button variant="outline" size="md" onClick={handlePrevious} disabled={page === 1}>
                이전
            </Button>
            <span>
                {page} / {totalPages} 페이지
            </span>
            <Button variant="outline" size="md" onClick={handleNext} disabled={page === totalPages}>
                다음
            </Button>
        </div>
    );
};

export { Pagination };

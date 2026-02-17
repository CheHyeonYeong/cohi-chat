import React from 'react';
import Button from '~/components/button/Button';

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
            <Button variant="secondary" size="md" onClick={handlePrevious} disabled={page === 1}>
                Previous
            </Button>
            <span>
                Page {page} of {totalPages}
            </span>
            <Button variant="secondary" size="md" onClick={handleNext} disabled={page === totalPages}>
                Next
            </Button>
        </div>
    );
};

export default Pagination; 
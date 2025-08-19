'use client';

import React, { FC, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
    showFirstLast?: boolean;
    showPreviousNext?: boolean;
    maxVisiblePages?: number;
}

const Pagination: FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    className = '',
    showFirstLast = true,
    showPreviousNext = true,
    maxVisiblePages = 7,
}) => {
    // Generate page numbers with ellipsis logic
    const pageNumbers = useMemo(() => {
        if (totalPages <= maxVisiblePages) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const pages: (number | string)[] = [];
        const sidePages = Math.floor((maxVisiblePages - 3) / 2); // Pages on each side of current

        // Always show first page
        pages.push(1);

        // Left ellipsis logic
        if (currentPage > sidePages + 2) {
            pages.push('...');
        }

        // Calculate start and end for middle section
        let start = Math.max(2, currentPage - sidePages);
        let end = Math.min(totalPages - 1, currentPage + sidePages);

        // Adjust if we're near the beginning or end
        if (currentPage <= sidePages + 2) {
            end = Math.min(totalPages - 1, maxVisiblePages - 1);
        }
        if (currentPage >= totalPages - sidePages - 1) {
            start = Math.max(2, totalPages - maxVisiblePages + 2);
        }

        // Add middle pages
        for (let i = start; i <= end; i++) {
            if (i !== 1 && i !== totalPages) {
                pages.push(i);
            }
        }

        // Right ellipsis logic
        if (currentPage < totalPages - sidePages - 1) {
            pages.push('...');
        }

        // Always show last page (if more than 1 page)
        if (totalPages > 1) {
            pages.push(totalPages);
        }

        return pages;
    }, [currentPage, totalPages, maxVisiblePages]);

    // Handle page navigation
    const handlePageClick = (page: number | string) => {
        if (typeof page === 'number' && page !== currentPage && page >= 1 && page <= totalPages) {
            onPageChange(page);
        }
    };

    // Navigation handlers
    const goToFirst = () => onPageChange(1);
    const goToPrevious = () => onPageChange(Math.max(1, currentPage - 1));
    const goToNext = () => onPageChange(Math.min(totalPages, currentPage + 1));
    const goToLast = () => onPageChange(totalPages);

    // Don't render if there's only one page or no pages
    if (totalPages <= 1) return null;

    const buttonBaseClasses = "inline-flex items-center justify-center min-w-[40px] h-10 px-3 text-sm font-medium transition-colors duration-200 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1";
    const enabledButtonClasses = "text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400";
    const disabledButtonClasses = "text-gray-400 bg-gray-50 cursor-not-allowed border-gray-200";
    const activeButtonClasses = "text-white bg-blue-600 border-blue-600 hover:bg-blue-700";

    return (
        <nav
            className={`flex items-center justify-center space-x-1 ${className}`}
            aria-label="Pagination Navigation"
            role="navigation"
        >
            {/* First Page Button */}
            {showFirstLast && (
                <button
                    onClick={goToFirst}
                    disabled={currentPage === 1}
                    aria-label="Go to first page"
                    className={`${buttonBaseClasses} rounded-l-md ${currentPage === 1 ? disabledButtonClasses : enabledButtonClasses
                        }`}
                >
                    <ChevronsLeft size={16} />
                </button>
            )}

            {/* Previous Page Button */}
            {showPreviousNext && (
                <button
                    onClick={goToPrevious}
                    disabled={currentPage === 1}
                    aria-label="Go to previous page"
                    className={`${buttonBaseClasses} ${showFirstLast ? '' : 'rounded-l-md'} ${currentPage === 1 ? disabledButtonClasses : enabledButtonClasses
                        }`}
                >
                    <ChevronLeft size={16} />
                </button>
            )}

            {/* Page Numbers */}
            {pageNumbers.map((page, index) => (
                <button
                    key={`page-${page}-${index}`}
                    onClick={() => handlePageClick(page)}
                    aria-label={
                        typeof page === 'number'
                            ? `${page === currentPage ? 'Current page, ' : ''}Go to page ${page}`
                            : 'More pages'
                    }
                    aria-current={page === currentPage ? 'page' : undefined}
                    disabled={typeof page !== 'number'}
                    className={`${buttonBaseClasses} ${page === currentPage
                            ? activeButtonClasses
                            : typeof page === 'number'
                                ? enabledButtonClasses
                                : 'text-gray-400 bg-white cursor-default border-gray-300'
                        }`}
                >
                    {page}
                </button>
            ))}

            {/* Next Page Button */}
            {showPreviousNext && (
                <button
                    onClick={goToNext}
                    disabled={currentPage === totalPages}
                    aria-label="Go to next page"
                    className={`${buttonBaseClasses} ${showFirstLast ? '' : 'rounded-r-md'} ${currentPage === totalPages ? disabledButtonClasses : enabledButtonClasses
                        }`}
                >
                    <ChevronRight size={16} />
                </button>
            )}

            {/* Last Page Button */}
            {showFirstLast && (
                <button
                    onClick={goToLast}
                    disabled={currentPage === totalPages}
                    aria-label="Go to last page"
                    className={`${buttonBaseClasses} rounded-r-md ${currentPage === totalPages ? disabledButtonClasses : enabledButtonClasses
                        }`}
                >
                    <ChevronsRight size={16} />
                </button>
            )}
        </nav>
    );
};

export default Pagination;
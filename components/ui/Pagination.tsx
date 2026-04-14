'use client';

import React from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startItem: number;
  endItem: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  isLoading?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  hasNextPage,
  hasPrevPage,
  startItem,
  endItem,
  onPageChange,
  onItemsPerPageChange,
  isLoading = false
}) => {
  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) {
        pageNumbers.push(i);
      }
      pageNumbers.push('...');
      pageNumbers.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pageNumbers.push(1);
      pageNumbers.push('...');
      for (let i = totalPages - 3; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      pageNumbers.push('...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pageNumbers.push(i);
      }
      pageNumbers.push('...');
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3 backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-2.5 text-sm text-slate-600 sm:flex-row sm:items-center">
        <span>
          Mostrando <span className="font-medium">{startItem}</span> a{' '}
          <span className="font-medium">{endItem}</span> de{' '}
          <span className="font-medium">{totalItems}</span> resultados
        </span>

        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Por página:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            disabled={isLoading}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-yellow-200 disabled:opacity-50"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1 sm:gap-1.5">
        <button
          onClick={() => onPageChange(1)}
          disabled={!hasPrevPage || isLoading}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-slate-400 transition-colors hover:border-slate-200 hover:bg-white hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          title="Primera página"
        >
          <FiChevronsLeft size={16} />
        </button>

        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevPage || isLoading}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-slate-400 transition-colors hover:border-slate-200 hover:bg-white hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          title="Página anterior"
        >
          <FiChevronLeft size={16} />
        </button>

        <div className="flex gap-1 sm:gap-1.5">
          {pageNumbers.map((pageNum, index) => (
            <button
              key={index}
              onClick={() => typeof pageNum === 'number' ? onPageChange(pageNum) : undefined}
              disabled={pageNum === '...' || pageNum === currentPage || isLoading}
              className={`min-w-10 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                pageNum === currentPage
                  ? 'bg-yellow-600 text-white shadow-sm'
                  : pageNum === '...'
                  ? 'cursor-default text-slate-400'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-50'
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage || isLoading}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-slate-400 transition-colors hover:border-slate-200 hover:bg-white hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          title="Página siguiente"
        >
          <FiChevronRight size={16} />
        </button>

        <button
          onClick={() => onPageChange(totalPages)}
          disabled={!hasNextPage || isLoading}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-slate-400 transition-colors hover:border-slate-200 hover:bg-white hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          title="Última página"
        >
          <FiChevronsRight size={16} />
        </button>
      </div>

      <div className="flex items-center gap-2 self-start lg:self-auto">
        <span className="text-sm text-slate-600">Ir a:</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={currentPage}
          onChange={(e) => {
            const page = Number(e.target.value);
            if (page >= 1 && page <= totalPages) {
              onPageChange(page);
            }
          }}
          disabled={isLoading}
          className="w-16 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-yellow-200 disabled:opacity-50"
        />
        <span className="text-sm text-slate-600">de {totalPages}</span>
      </div>
    </div>
  );
};

export default Pagination;

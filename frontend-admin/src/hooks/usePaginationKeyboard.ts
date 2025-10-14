import { useEffect } from 'react';

interface UsePaginationKeyboardProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNext: boolean;
  hasPrev: boolean;
  enabled?: boolean;
}

export const usePaginationKeyboard = ({
  currentPage,
  totalPages,
  onPageChange,
  hasNext,
  hasPrev,
  enabled = true,
}: UsePaginationKeyboardProps) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keyboard shortcuts when not typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Handle keyboard shortcuts
      switch (event.key) {
        case 'ArrowLeft':
          if (event.ctrlKey && hasPrev) {
            event.preventDefault();
            onPageChange(currentPage - 1);
          }
          break;
        case 'ArrowRight':
          if (event.ctrlKey && hasNext) {
            event.preventDefault();
            onPageChange(currentPage + 1);
          }
          break;
        case 'Home':
          if (event.ctrlKey && currentPage > 1) {
            event.preventDefault();
            onPageChange(1);
          }
          break;
        case 'End':
          if (event.ctrlKey && currentPage < totalPages) {
            event.preventDefault();
            onPageChange(totalPages);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, onPageChange, hasNext, hasPrev, enabled]);
};

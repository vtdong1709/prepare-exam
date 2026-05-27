'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BottomNavigationProps {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
  canPrevious: boolean;
  canNext: boolean;
}

export default function BottomNavigation({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  canPrevious,
  canNext
}: BottomNavigationProps) {
  return (
    <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Previous Button */}
        <button
          onClick={onPrevious}
          disabled={!canPrevious}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-muted text-foreground"
          aria-label="Previous question"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Progress Counter */}
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {currentPage} <span className="text-muted-foreground">/ {totalPages}</span>
          </p>
        </div>

        {/* Next Button */}
        <button
          onClick={onNext}
          disabled={!canNext}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-muted text-foreground"
          aria-label="Next question"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

'use client';

import { Bookmark, Moon, Sun } from 'lucide-react';

interface TopBarProps {
  examTitle: string;
  progress: string;
  isBookmarked: boolean;
  onBookmarkToggle: () => void;
  onThemeToggle: () => void;
  currentTheme?: string;
}

export default function TopBar({
  examTitle,
  progress,
  isBookmarked,
  onBookmarkToggle,
  onThemeToggle,
  currentTheme
}: TopBarProps) {
  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Exam Title */}
        <div className="flex-1">
          <h1 className="text-sm font-semibold text-muted-foreground">{examTitle}</h1>
        </div>

        {/* Center: Progress */}
        <div className="flex-1 text-center">
          <p className="text-sm font-medium text-foreground">{progress}</p>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4">
          {/* Bookmark Button */}
          <button
            onClick={onBookmarkToggle}
            className="inline-flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
            aria-label="Bookmark question"
          >
            <Bookmark
              className="h-5 w-5"
              fill={isBookmarked ? 'currentColor' : 'none'}
            />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onThemeToggle}
            className="inline-flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          >
            {currentTheme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

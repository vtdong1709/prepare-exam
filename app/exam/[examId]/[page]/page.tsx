'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { getExamPage } from '@/src/services/examApi';
import QuestionCard from '@/components/QuestionCard';
import TopBar from '@/components/TopBar';
import BottomNavigation from '@/components/BottomNavigation';

interface NormalizedQuestion {
  id: number | string;
  questionText: string;
  choices: Record<string, string>;
  correctAnswer: string;
  explanation: string | null;
  discussion: Array<{
    poster?: string;
    user?: string;
    content: string;
    timestamp?: string;
    timeAgo?: string;
    upvote_count?: number;
    comments?: any[];
  }>;
  communityAnswers?: string[];
  questionImages?: string[];
  answerImages?: string[];
  topic?: string | null;
  totalPages?: number;
}

function QuestionSkeleton() {
  return (
    <div className="w-full max-w-2xl space-y-8 animate-pulse">
      <div className="rounded-xl border border-border bg-card/50 p-8 shadow-sm space-y-6">
        <div className="h-4 w-24 bg-muted rounded"></div>
        <div className="space-y-3">
          <div className="h-6 w-full bg-muted rounded"></div>
          <div className="h-6 w-5/6 bg-muted rounded"></div>
        </div>
        <div className="space-y-3 pt-4">
          <div className="h-14 w-full bg-muted rounded-lg"></div>
          <div className="h-14 w-full bg-muted rounded-lg"></div>
          <div className="h-14 w-full bg-muted rounded-lg"></div>
          <div className="h-14 w-full bg-muted rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}

export default function QuestionPage() {
  const params = useParams();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const examId = params?.examId as string;
  const pageNum = parseInt(params?.page as string, 10) || 1;

  const [question, setQuestion] = useState<NormalizedQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(100); // Default placeholder, updated dynamically if available

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    if (!examId || !pageNum) return;
    setLoading(true);
    setError(null);
    try {
      const questions = await getExamPage(examId, pageNum, signal);
      if (questions && questions.length > 0) {
        setQuestion(questions[0]);
        // Try to infer total pages from API or keep current bounds
        if (questions[0].totalPages) {
          setTotalPages(questions[0].totalPages);
        }
      } else {
        setError('No question found for this page.');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      setError(err.message || 'Unable to load question.');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [examId, pageNum]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    setSelectedAnswer(null);
    setShowFeedback(false);

    return () => {
      controller.abort();
    };
  }, [fetchData]);

  const handleSelectAnswer = (answer: string) => {
    if (!showFeedback) {
      setSelectedAnswer(answer);
      setShowFeedback(true);
    }
  };

  const handleNext = () => {
    if (pageNum < totalPages) {
      router.push(`/exam/${examId}/${pageNum + 1}`);
    }
  };

  const handlePrevious = () => {
    if (pageNum > 1) {
      router.push(`/exam/${examId}/${pageNum - 1}`);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isCorrect = selectedAnswer === question?.correctAnswer;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      {mounted && (
        <TopBar
          examTitle={question?.topic || `Exam ${examId}`}
          progress={`Question ${pageNum}`}
          isBookmarked={isBookmarked}
          onBookmarkToggle={() => setIsBookmarked(!isBookmarked)}
          onThemeToggle={toggleTheme}
          currentTheme={theme}
        />
      )}

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        {loading ? (
          <QuestionSkeleton />
        ) : error ? (
          <div className="text-center py-12 space-y-4">
            <h1 className="text-2xl font-semibold text-foreground">{error}</h1>
            <p className="text-muted-foreground">Please check your network and try again.</p>
            <button
              onClick={() => fetchData()}
              className="px-6 py-2.5 bg-accent text-accent-foreground font-medium rounded-lg hover:bg-accent/80 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : question ? (
          <div className="w-full max-w-2xl space-y-8">
            {/* Question Card */}
            <div className="animate-fade-in">
              <QuestionCard
                question={question}
                selectedAnswer={selectedAnswer}
                onSelectAnswer={handleSelectAnswer}
                isCorrect={isCorrect}
                showFeedback={showFeedback}
              />
            </div>

            {/* Feedback Section */}
            {showFeedback && (
              <div className="animate-fade-in space-y-6">
                {/* Answer Status */}
                <div
                  className={`rounded-xl border-2 p-6 transition-all ${
                    isCorrect
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-red-500/30 bg-red-500/5'
                  }`}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-full transition-all ${
                        isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'
                      } flex items-center justify-center`}
                    >
                      <span
                        className={`text-sm font-semibold ${
                          isCorrect ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {isCorrect ? '✓' : '✗'}
                      </span>
                    </div>
                    <h3
                      className={`text-lg font-semibold ${
                        isCorrect ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {isCorrect ? 'Correct!' : 'Incorrect'}
                    </h3>
                  </div>

                  {!isCorrect && (
                    <p className="text-sm text-muted-foreground">
                      Correct answer: <span className="font-semibold text-foreground">{question.correctAnswer}</span>
                    </p>
                  )}
                </div>

                {/* Explanation */}
                {question.explanation && (
                  <div className="space-y-3 rounded-xl border border-border bg-card/50 p-6">
                    <h3 className="font-semibold text-foreground">Explanation</h3>
                    <p className="leading-relaxed text-muted-foreground whitespace-pre-wrap">
                      {question.explanation}
                    </p>

                    {/* Answer Images */}
                    {question.answerImages && question.answerImages.length > 0 && (
                      <div className="mt-4 space-y-4">
                        {question.answerImages.map((src, index) => (
                          <img
                            key={index}
                            src={src}
                            alt={`Explanation graphic ${index + 1}`}
                            className="max-w-full rounded-lg border border-border"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Community Vote (Optional) */}
                {question.communityAnswers && question.communityAnswers.length > 0 && (
                  <div className="space-y-3 rounded-xl border border-border bg-card/50 p-6">
                    <h3 className="font-semibold text-foreground">Community Vote</h3>
                    <div className="space-y-2">
                      {question.communityAnswers.map((vote, idx) => (
                        <p key={idx} className="text-sm text-muted-foreground">
                          {vote}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Discussion */}
                {question.discussion && question.discussion.length > 0 && (
                  <details className="group rounded-xl border border-border bg-card/50 p-6">
                    <summary className="cursor-pointer select-none font-semibold text-foreground transition-colors hover:text-accent">
                      <span className="inline-flex items-center gap-2">
                        <span className="transition-transform group-open:rotate-180">▼</span>
                        Discussion ({question.discussion.length})
                      </span>
                    </summary>

                    <div className="mt-4 space-y-4 border-t border-border pt-4">
                      {question.discussion.map((comment, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">
                                {comment.poster || comment.user || 'Anonymous'}
                              </p>
                              {comment.upvote_count !== undefined && (
                                <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                                  ▲ {comment.upvote_count}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {comment.timestamp || comment.timeAgo || ''}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {comment.content}
                          </p>

                          {/* Nested Comments */}
                          {comment.comments && comment.comments.length > 0 && (
                            <div className="pl-6 border-l-2 border-muted mt-2 space-y-3">
                              {comment.comments.map((subcomment: any, subIdx: number) => (
                                <div key={subIdx} className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium text-foreground">
                                      {subcomment.poster || subcomment.user || 'Anonymous'}
                                    </p>
                                    <span className="text-[10px] text-muted-foreground">
                                      {subcomment.timestamp || subcomment.timeAgo || ''}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {subcomment.content}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>
        ) : null}
      </main>

      {/* Bottom Navigation */}
      {mounted && (
        <BottomNavigation
          currentPage={pageNum}
          totalPages={totalPages}
          onPrevious={handlePrevious}
          onNext={handleNext}
          canPrevious={pageNum > 1}
          canNext={pageNum < totalPages}
        />
      )}
    </div>
  );
}


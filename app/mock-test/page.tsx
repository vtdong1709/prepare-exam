'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import examDataJson from '@/exam_41_full_data.json';
import { ExamData, Question } from '@/types/exam';
import QuestionItem from '@/components/QuestionItem';
import { 
  Sparkles, 
  ArrowLeft, 
  Timer, 
  CheckCircle, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  Bookmark,
  RotateCcw,
  BookOpen,
  Award,
  Play
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;
const TEST_QUESTION_COUNT = 50;
const TEST_DURATION_MINUTES = 90; // 90 minutes

const examData = examDataJson as unknown as ExamData;
const allQuestions = examData.pageProps.questions;

interface TestState {
  questions: Question[];
  answers: Record<string, { selected: string[]; isCorrect: boolean }>;
  isSubmitted: boolean;
  timeLeft: number; // in seconds
  elapsedSeconds: number;
}

export default function MockTestPage() {
  const [test, setTest] = useState<TestState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Client storage
  useEffect(() => {
    setIsClient(true);
    // Load Bookmarks
    try {
      const storedBookmarks = localStorage.getItem('exam_bookmarks');
      if (storedBookmarks) {
        setBookmarks(JSON.parse(storedBookmarks));
      }
      
      // Load any unfinished test state from localStorage to prevent loss on refresh
      const storedTest = localStorage.getItem('active_mock_test');
      if (storedTest) {
        const parsed = JSON.parse(storedTest) as TestState;
        setTest(parsed);
      }
    } catch (e) {
      console.error('Error loading localStorage data', e);
    }
  }, []);

  // Save Bookmarks to localStorage
  const handleToggleBookmark = (id: string) => {
    setBookmarks(prev => {
      const next = prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id];
      localStorage.setItem('exam_bookmarks', JSON.stringify(next));
      return next;
    });
  };

  // Timer effect
  useEffect(() => {
    if (test && !test.isSubmitted && test.timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTest(prev => {
          if (!prev) return null;
          if (prev.timeLeft <= 1) {
            // Time is up! Auto submit
            clearInterval(timerRef.current!);
            const finalState = {
              ...prev,
              timeLeft: 0,
              isSubmitted: true,
              elapsedSeconds: TEST_DURATION_MINUTES * 60
            };
            localStorage.setItem('active_mock_test', JSON.stringify(finalState));
            alert('Hết giờ làm bài! Hệ thống đã tự động nộp bài thi của bạn.');
            return finalState;
          }
          const nextState = {
            ...prev,
            timeLeft: prev.timeLeft - 1,
            elapsedSeconds: prev.elapsedSeconds + 1
          };
          // Sync state to local storage
          localStorage.setItem('active_mock_test', JSON.stringify(nextState));
          return nextState;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [test?.timeLeft, test?.isSubmitted]);

  // Start new mock test
  const handleStartTest = () => {
    // Randomly select 50 questions
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, TEST_QUESTION_COUNT);

    const newTest: TestState = {
      questions: selectedQuestions,
      answers: {},
      isSubmitted: false,
      timeLeft: TEST_DURATION_MINUTES * 60,
      elapsedSeconds: 0
    };

    setTest(newTest);
    setCurrentPage(1);
    localStorage.setItem('active_mock_test', JSON.stringify(newTest));
  };

  // Handle choice selection during test
  const handleAnswerSelect = (id: string, selected: string[], isCorrect: boolean) => {
    if (!test || test.isSubmitted) return;

    setTest(prev => {
      if (!prev) return null;
      const updatedAnswers = { ...prev.answers };
      if (selected.length === 0) {
        delete updatedAnswers[id];
      } else {
        updatedAnswers[id] = { selected, isCorrect };
      }
      
      const nextState = {
        ...prev,
        answers: updatedAnswers
      };
      localStorage.setItem('active_mock_test', JSON.stringify(nextState));
      return nextState;
    });
  };

  // Submit test
  const handleSubmitTest = (force = false) => {
    if (!test || test.isSubmitted) return;

    const unansweredCount = TEST_QUESTION_COUNT - Object.keys(test.answers).length;
    
    if (!force && unansweredCount > 0) {
      const confirmSubmit = window.confirm(`Bạn còn ${unansweredCount} câu chưa trả lời. Bạn vẫn muốn nộp bài thi chứ?`);
      if (!confirmSubmit) return;
    } else if (!force) {
      const confirmSubmit = window.confirm('Bạn muốn hoàn thành và nộp bài thi?');
      if (!confirmSubmit) return;
    }

    setTest(prev => {
      if (!prev) return null;
      const nextState = {
        ...prev,
        isSubmitted: true
      };
      localStorage.setItem('active_mock_test', JSON.stringify(nextState));
      return nextState;
    });

    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentPage(1); // Scroll to top page 1 to review
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Exit/Reset Mock Test
  const handleExitTest = () => {
    if (!test?.isSubmitted) {
      const confirmExit = window.confirm('Bài thi đang diễn ra. Mọi tiến trình thi thử hiện tại sẽ bị xóa. Bạn vẫn muốn thoát chứ?');
      if (!confirmExit) return;
    }
    
    setTest(null);
    localStorage.removeItem('active_mock_test');
  };

  // Pagination list
  const paginatedQuestions = useMemo(() => {
    if (!test) return [];
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return test.questions.slice(start, start + ITEMS_PER_PAGE);
  }, [test, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Calculate statistics
  const testResults = useMemo(() => {
    if (!test) return null;
    const answered = Object.keys(test.answers).length;
    const correct = Object.values(test.answers).filter(a => a.isCorrect).length;
    const incorrect = answered - correct;
    const unanswered = TEST_QUESTION_COUNT - answered;
    const scorePercent = Math.round((correct / TEST_QUESTION_COUNT) * 100);
    const passed = scorePercent >= 70; // 70% passing threshold
    
    const minutes = Math.floor(test.elapsedSeconds / 60);
    const seconds = test.elapsedSeconds % 60;
    const timeSpentString = `${minutes} phút ${seconds} giây`;

    return {
      answered,
      correct,
      incorrect,
      unanswered,
      scorePercent,
      passed,
      timeSpentString
    };
  }, [test]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalPages = Math.ceil((test?.questions.length || 0) / ITEMS_PER_PAGE) || 1;

  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxPageNumbersToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPageNumbersToShow / 2));
    let endPage = startPage + maxPageNumbersToShow - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPageNumbersToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Navigation Bar */}
        <div className="mb-6 flex justify-between items-center">
          <Link
            href="/dashboard"
            onClick={(e) => {
              if (test && !test.isSubmitted) {
                e.preventDefault();
                handleExitTest();
              }
            }}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại bảng Dashboard
          </Link>
          
          {test && (
            <button
              onClick={handleExitTest}
              className="px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-medium text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all active:scale-95"
            >
              Thoát kỳ thi
            </button>
          )}
        </div>

        {/* 1. SETUP / RULES SCREEN */}
        {!test ? (
          <div className="max-w-xl mx-auto mt-12 bg-slate-900/40 border border-slate-900 rounded-3xl p-8 backdrop-blur-md shadow-2xl text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20 text-cyan-400 mb-2">
              <Award className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-100">
                Đề Thi Thử Ngẫu Nhiên
              </h2>
              <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                Được tạo ngẫu nhiên từ 400+ câu hỏi luyện thi tiếng Anh chính thức để kiểm tra kiến thức của bạn.
              </p>
            </div>

            {/* Test Rules List */}
            <div className="bg-slate-950/50 rounded-2xl border border-slate-900 p-5 text-left space-y-3.5 text-sm text-slate-300">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <span>Số lượng: <b>{TEST_QUESTION_COUNT} câu hỏi</b> trắc nghiệm & tự luận ngẫu nhiên.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <span>Thời gian giới hạn: <b>{TEST_DURATION_MINUTES} phút</b>.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <span>Ẩn đáp án & giải thích khi làm bài thi.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <span>Đánh giá kết quả chi tiết & mở khóa giải thích sau khi nộp bài.</span>
              </div>
            </div>

            <button
              onClick={handleStartTest}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3.5 px-6 transition-all active:scale-[0.98] shadow-lg shadow-cyan-500/10"
            >
              <Play className="h-4.5 w-4.5 fill-slate-950 text-slate-950" />
              Bắt đầu làm bài thi thử
            </button>
          </div>
        ) : (
          // 2. ACTIVE TEST OR RESULTS REVIEW
          <div className="space-y-6">
            
            {/* Header Dashboard & Results HUD */}
            {test.isSubmitted && testResults ? (
              <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 md:p-8 backdrop-blur-sm text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                    Hoàn thành thi thử
                  </div>
                  <h2 className="text-3xl font-extrabold text-slate-100">Kết Quả Đề Thi Thử</h2>
                  <p className="text-slate-400 text-sm max-w-md">
                    Tổng thời gian làm bài: <b>{testResults.timeSpentString}</b>. Bạn đã xem lại lời giải bên dưới để hiểu sâu hơn.
                  </p>
                </div>

                <div className="flex items-center justify-center md:justify-end gap-6">
                  {/* Score box */}
                  <div className="text-center bg-slate-950/60 rounded-2xl border border-slate-850 p-4 min-w-[120px]">
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Kết quả</span>
                    <span className="text-3xl font-black block text-cyan-400">{testResults.correct} / 50</span>
                    <span className="text-xs text-slate-500 block mt-1">câu trả lời đúng</span>
                  </div>

                  {/* Rating Badge */}
                  <div className={`text-center rounded-2xl border p-4 min-w-[120px] ${
                    testResults.passed 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}>
                    <span className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">Đánh giá</span>
                    <span className="text-3xl font-black block">{testResults.scorePercent}%</span>
                    <span className="text-xs font-bold block mt-1">{testResults.passed ? 'ĐẠT (PASS)' : 'CHƯA ĐẠT'}</span>
                  </div>
                </div>
              </div>
            ) : (
              // Active HUD containing status and live timer
              <div className="sticky top-4 z-40 bg-slate-950/80 border border-slate-900 rounded-2xl p-4 md:p-5 backdrop-blur-md shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-850 px-4 py-2 rounded-xl text-slate-200">
                    <Timer className={`h-4.5 w-4.5 ${test.timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-cyan-400'}`} />
                    <span className={`font-mono font-bold text-sm ${test.timeLeft < 300 ? 'text-rose-400' : 'text-slate-200'}`}>
                      {formatTimer(test.timeLeft)}
                    </span>
                  </div>
                  
                  <div className="flex-1 md:flex-none">
                    <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
                      <span>Đã làm: {Object.keys(test.answers).length} / {TEST_QUESTION_COUNT}</span>
                    </div>
                    <div className="w-32 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-850 p-0.5">
                      <div 
                        className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${(Object.keys(test.answers).length / TEST_QUESTION_COUNT) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto">
                  <button
                    onClick={() => handleSubmitTest(false)}
                    className="w-full md:w-auto rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-2.5 text-sm transition-all active:scale-[0.98] shadow-lg shadow-cyan-500/10"
                  >
                    Nộp bài thi thử
                  </button>
                </div>
              </div>
            )}

            {/* Questions lists */}
            <div className="space-y-6 mt-6">
              {paginatedQuestions.map((question, i) => {
                const qId = question.id || String(question.question_id);
                return (
                  <QuestionItem
                    key={qId}
                    question={question}
                    index={(currentPage - 1) * ITEMS_PER_PAGE + i + 1}
                    isBookmarked={bookmarks.includes(qId)}
                    onToggleBookmark={handleToggleBookmark}
                    savedAnswers={test.answers[qId]?.selected || []}
                    onAnswerSelect={handleAnswerSelect}
                    hideFeedback={!test.isSubmitted} // Hides correctness indicators and explanations until submitted
                  />
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-900 pt-6">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors disabled:opacity-30 disabled:pointer-events-none active:scale-[0.98]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Trang trước</span>
                </button>

                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  {pageNumbers.map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`inline-flex items-center justify-center h-9 w-9 rounded-lg text-sm font-bold transition-all ${
                        currentPage === page
                          ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-500/30'
                          : 'border border-slate-800/60 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors disabled:opacity-30 disabled:pointer-events-none active:scale-[0.98]"
                >
                  <span>Trang sau</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            )}

            {/* Post-submit review banner */}
            {test.isSubmitted && (
              <div className="mt-8 p-6 bg-slate-900/20 border border-slate-900 rounded-3xl text-center space-y-4">
                <h3 className="text-lg font-bold text-slate-200">Đã xem xét và ôn luyện xong bài thi?</h3>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={handleStartTest}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-2.5 text-sm transition-all active:scale-[0.98]"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Thi đề mới
                  </button>
                  <Link
                    href="/dashboard"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 px-6 py-2.5 text-sm font-bold text-slate-300 transition-all active:scale-[0.98]"
                  >
                    Về Dashboard ôn tập
                  </Link>
                </div>
              </div>
            )}
            
          </div>
        )}

      </div>
    </div>
  );
}

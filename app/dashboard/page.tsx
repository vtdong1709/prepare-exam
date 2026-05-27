"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import examDataJson from "@/full_330_questions.json";
import { ExamData, Question } from "@/types/exam";
import QuestionItem from "@/components/QuestionItem";
import {
  BookOpen,
  Search,
  Filter,
  RotateCcw,
  Bookmark,
  CheckCircle,
  XCircle,
  HelpCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Info,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

interface UserAnswer {
  selected: string[];
  isCorrect: boolean;
}

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [studyStatus, setStudyStatus] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);

  // Khởi tạo State lưu trữ toàn bộ danh sách câu hỏi một cách an toàn
  const [questionsList, setQuestionsList] = useState<Question[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, UserAnswer>>({});
  const [isClient, setIsClient] = useState(false);

  // Xử lý dữ liệu an toàn ở Client-side để tránh lỗi SSR/Hydration và lấy trọn vẹn 330 câu
  useEffect(() => {
    setIsClient(true);
    try {
      // Kiểm tra cấu trúc thực tế của JSON để bóc tách mảng câu hỏi chuẩn xác nhất
      const data = examDataJson as any;
      const extractedQuestions =
        Array.isArray(data) ? data : (data?.pageProps?.questions || data?.questions || []);
      setQuestionsList(extractedQuestions);

      // Load tiến trình từ localStorage
      const storedBookmarks = localStorage.getItem("exam_bookmarks");
      if (storedBookmarks) setBookmarks(JSON.parse(storedBookmarks));

      const storedAnswers = localStorage.getItem("exam_answers");
      if (storedAnswers) setAnswers(JSON.parse(storedAnswers));
    } catch (e) {
      console.error("Lỗi khi đọc file JSON hoặc localStorage:", e);
    }
  }, []);

  // Đóng gói sync Bookmarks
  const handleToggleBookmark = (id: string) => {
    setBookmarks((prev) => {
      const next = prev.includes(id)
        ? prev.filter((bId) => bId !== id)
        : [...prev, id];
      localStorage.setItem("exam_bookmarks", JSON.stringify(next));
      return next;
    });
  };

  // Đóng gói sync Answers
  const handleAnswerSelect = (
    id: string,
    selected: string[],
    isCorrect: boolean,
  ) => {
    setAnswers((prev) => {
      const next = { ...prev };
      if (selected.length === 0) {
        delete next[id];
      } else {
        next[id] = { selected, isCorrect };
      }
      localStorage.setItem("exam_answers", JSON.stringify(next));
      return next;
    });
  };

  const handleResetProgress = () => {
    if (
      window.confirm(
        "Bạn có chắc chắn muốn xóa toàn bộ tiến trình học tập (đáp án đã chọn, dấu trang)?",
      )
    ) {
      localStorage.removeItem("exam_bookmarks");
      localStorage.removeItem("exam_answers");
      setBookmarks([]);
      setAnswers({});
      setCurrentPage(1);
    }
  };

  // Reset trang về 1 mỗi khi thay đổi bộ lọc tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTopic, selectedType, studyStatus]);

  // Trích xuất danh sách Topics độc nhất
  const topics = useMemo(() => {
    const list = new Set<string>();
    questionsList.forEach((q) => {
      if (q.topic) list.add(String(q.topic));
    });
    return [
      "All",
      ...Array.from(list).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
      ),
    ];
  }, [questionsList]);

  // Tính toán Thống kê dữ liệu HUD dựa trên toàn bộ questionsList thực tế
  const stats = useMemo(() => {
    const total = questionsList.length;
    const answeredCount = Object.keys(answers).length;
    const correctCount = Object.values(answers).filter(
      (a) => a.isCorrect,
    ).length;
    const incorrectCount = answeredCount - correctCount;
    const bookmarkedCount = bookmarks.length;
    const progressPercent =
      total > 0 ? Math.round((answeredCount / total) * 100) : 0;
    const accuracyRate =
      answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

    return {
      total,
      answeredCount,
      correctCount,
      incorrectCount,
      bookmarkedCount,
      progressPercent,
      accuracyRate,
    };
  }, [questionsList, answers, bookmarks]);

  // Bộ lọc nâng cao: Tìm kiếm text, ID, Type, và Status làm bài trên toàn chuỗi 330 câu
  const filteredQuestions = useMemo(() => {
    return questionsList.filter((q) => {
      const qId = String(q.id || q.question_id || "");

      const matchesSearch =
        searchQuery === "" ||
        q.question_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        qId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTopic =
        selectedTopic === "All" || String(q.topic) === selectedTopic;

      const matchesType =
        selectedType === "All" ||
        (selectedType === "MC" && q.isMC) ||
        (selectedType === "Non-MC" && !q.isMC);

      let matchesStatus = true;
      const isAnswered = qId in answers;
      const isCorrect = isAnswered && answers[qId].isCorrect;

      if (studyStatus === "Unanswered") matchesStatus = !isAnswered;
      else if (studyStatus === "Correct") matchesStatus = isCorrect;
      else if (studyStatus === "Incorrect")
        matchesStatus = isAnswered && !isCorrect;
      else if (studyStatus === "Bookmarked")
        matchesStatus = bookmarks.includes(qId);

      return matchesSearch && matchesTopic && matchesType && matchesStatus;
    });
  }, [
    questionsList,
    searchQuery,
    selectedTopic,
    selectedType,
    studyStatus,
    answers,
    bookmarks,
  ]);

  // Xử lý phân trang mượt mà chống giật lag DOM
  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE) || 1;

  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredQuestions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredQuestions, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedTopic("All");
    setSelectedType("All");
    setStudyStatus("All");
    setCurrentPage(1);
  };

  // Tính toán dãy số phân trang hiển thị (Tối đa 5 nút số)
  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Đang đồng bộ dữ liệu bộ đề...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-6 border-b border-slate-900">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-cyan-100 to-cyan-400 bg-clip-text text-transparent flex items-center justify-center sm:justify-start gap-2">
              <Sparkles className="h-8 w-8 text-cyan-400 shrink-0" />
              Bảng Học Tập Thông Minh
            </h1>
            <p className="mt-2 text-slate-400 text-sm md:text-base">
              Lưu tiến trình học tự động, tối ưu hóa bộ nhớ cho tổng số{" "}
              <b className="text-cyan-400">{stats.total}</b> câu hỏi.
            </p>
          </div>
          <div className="flex justify-center sm:justify-start gap-3">
            <Link
              href="/mock-test"
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2.5 text-xs font-bold transition-all active:scale-95 shadow-lg shadow-cyan-500/10"
            >
              Thi thử (Mock Test)
            </Link>
            <button
              onClick={handleResetProgress}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900/60 border border-red-500/30 text-red-400 hover:bg-red-500/10 px-4 py-2.5 text-xs font-semibold transition-all active:scale-95"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Xóa tiến trình làm bài
            </button>
          </div>
        </header>

        {/* HUD Tiến độ */}
        <section className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 mb-8 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2.5">
              <div className="flex justify-between items-end text-sm">
                <span className="font-semibold text-slate-350 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-cyan-400" />
                  Tiến độ hoàn thành
                </span>
                <span className="font-mono font-bold text-cyan-400">
                  {stats.answeredCount} / {stats.total} ({stats.progressPercent}
                  %)
                </span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-900 p-0.5">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.progressPercent}%` }}
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-end text-sm">
                <span className="font-semibold text-slate-350 flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  Tỷ lệ chính xác
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  {stats.accuracyRate}%
                </span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-900 p-0.5">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.accuracyRate}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-start md:justify-end gap-3 flex-wrap">
              <button
                onClick={() =>
                  setStudyStatus(
                    studyStatus === "Incorrect" ? "All" : "Incorrect",
                  )
                }
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  studyStatus === "Incorrect"
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    : "bg-slate-950 text-slate-300 border-slate-850 hover:bg-slate-900 hover:border-slate-700"
                }`}
              >
                <XCircle className="h-3.5 w-3.5 text-rose-400" />
                Luyện câu sai ({stats.incorrectCount})
              </button>

              <button
                onClick={() =>
                  setStudyStatus(
                    studyStatus === "Bookmarked" ? "All" : "Bookmarked",
                  )
                }
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  studyStatus === "Bookmarked"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-slate-950 text-slate-300 border-slate-850 hover:bg-slate-900 hover:border-slate-700"
                }`}
              >
                <Bookmark className="h-3.5 w-3.5 text-amber-400 fill-amber-400/20" />
                Đã lưu trữ ({stats.bookmarkedCount})
              </button>
            </div>
          </div>
        </section>

        {/* Thanh Bộ Lọc & Tìm kiếm */}
        <section className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 mb-8 backdrop-blur-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Từ khoá / ID câu hỏi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 transition-colors"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/80 transition-colors appearance-none cursor-pointer"
              >
                <option value="All">Mọi chủ đề</option>
                {topics
                  .filter((t) => t !== "All")
                  .map((topic) => (
                    <option key={topic} value={topic}>
                      Chủ đề {topic}
                    </option>
                  ))}
              </select>
            </div>

            <div className="relative">
              <HelpCircle className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <select
                value={studyStatus}
                onChange={(e) => setStudyStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/80 transition-colors appearance-none cursor-pointer"
              >
                <option value="All">Tất cả tiến độ</option>
                <option value="Unanswered">Chưa làm bài</option>
                <option value="Correct">Đã làm đúng</option>
                <option value="Incorrect">Đã làm sai</option>
                <option value="Bookmarked">Đã đánh dấu</option>
              </select>
            </div>

            <div className="relative flex gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/80 transition-colors appearance-none cursor-pointer"
              >
                <option value="All">Mọi dạng câu hỏi</option>
                <option value="MC">Trắc nghiệm (MC)</option>
                <option value="Non-MC">Kéo thả / Tự luận</option>
              </select>

              {(searchQuery ||
                selectedTopic !== "All" ||
                selectedType !== "All" ||
                studyStatus !== "All") && (
                <button
                  onClick={handleResetFilters}
                  title="Đặt lại bộ lọc"
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 rounded-xl p-3 text-slate-400 hover:text-slate-200 transition-all shrink-0 active:scale-95"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-cyan-400/80" />
              <span>
                Tìm thấy <b>{filteredQuestions.length}</b> / {stats.total} câu
                hỏi khớp bộ lọc.
              </span>
            </div>
            {filteredQuestions.length > 0 && (
              <span>
                Hiển thị trang {currentPage} / {totalPages}.
              </span>
            )}
          </div>
        </section>

        {/* Danh sách Câu hỏi (Đã phân trang chống Lag DOM) */}
        <section className="space-y-6">
          {paginatedQuestions.length > 0 ? (
            paginatedQuestions.map((question, i) => {
              const qId = String(question.id || question.question_id || "");
              return (
                <QuestionItem
                  key={qId}
                  question={question}
                  index={(currentPage - 1) * ITEMS_PER_PAGE + i + 1}
                  isBookmarked={bookmarks.includes(qId)}
                  onToggleBookmark={handleToggleBookmark}
                  savedAnswers={answers[qId]?.selected || []}
                  onAnswerSelect={handleAnswerSelect}
                />
              );
            })
          ) : (
            <div className="text-center py-20 rounded-2xl border border-dashed border-slate-800 bg-slate-900/10">
              <BookOpen className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-350">
                Không có câu hỏi nào khớp
              </h3>
              <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
                Hãy thử đặt lại tất cả bộ lọc để xem lại các câu hỏi gốc.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
              >
                Đặt lại tất cả bộ lọc
              </button>
            </div>
          )}
        </section>

        {/* Điều hướng trang (Pagination Controls) */}
        {totalPages > 1 && (
          <nav className="mt-12 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-900 pt-6">
            <div className="flex w-full md:w-auto items-center gap-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 px-3.5 py-2.5 text-xs font-semibold text-slate-300 transition-colors disabled:opacity-30 disabled:pointer-events-none active:scale-[0.98]"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
                <span>Trang đầu</span>
              </button>

              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 px-3.5 py-2.5 text-xs font-semibold text-slate-300 transition-colors disabled:opacity-30 disabled:pointer-events-none active:scale-[0.98]"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Trang trước</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap justify-center my-2 md:my-0">
              {pageNumbers[0] > 1 && (
                <>
                  <button
                    onClick={() => handlePageChange(1)}
                    className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-sm font-medium transition-colors border border-slate-800/40 text-slate-400 hover:bg-slate-900"
                  >
                    1
                  </button>
                  {pageNumbers[0] > 2 && (
                    <span className="text-slate-600 px-1">...</span>
                  )}
                </>
              )}

              {pageNumbers.map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`inline-flex items-center justify-center h-9 w-9 rounded-lg text-sm font-bold transition-all ${
                    currentPage === page
                      ? "bg-cyan-500 text-slate-950 ring-2 ring-cyan-500/30"
                      : "border border-slate-800/60 text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  {page}
                </button>
              ))}

              {pageNumbers[pageNumbers.length - 1] < totalPages && (
                <>
                  {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                    <span className="text-slate-600 px-1">...</span>
                  )}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-sm font-medium transition-colors border border-slate-800/40 text-slate-400 hover:bg-slate-900"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            <div className="flex w-full md:w-auto items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 px-3.5 py-2.5 text-xs font-semibold text-slate-300 transition-colors disabled:opacity-30 disabled:pointer-events-none active:scale-[0.98]"
              >
                <span>Trang sau</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 px-3.5 py-2.5 text-xs font-semibold text-slate-300 transition-colors disabled:opacity-30 disabled:pointer-events-none active:scale-[0.98]"
              >
                <span>Trang cuối</span>
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}

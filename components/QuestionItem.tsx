import React, { useState } from 'react';
import { Comment, Question } from '../types/exam';
import { MessageSquare, ChevronDown, ChevronUp, Check, X, ThumbsUp, Calendar, User, Bookmark, Copy } from 'lucide-react';
import ImageZoom from './ImageZoom';

function formatCommentTime(timestamp: string): string {
  if (!timestamp) return '';
  const num = parseFloat(timestamp);
  if (isNaN(num)) return timestamp;
  
  const date = new Date(num * (num < 10000000000 ? 1000 : 1));
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

const CommentNode: React.FC<{ comment: Comment; depth: number }> = ({ comment, depth }) => {
  const formattedTime = formatCommentTime(comment.timestamp);
  
  return (
    <div className="mt-4 transition-all duration-300">
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded text-xs font-medium text-cyan-400 border border-slate-700/50">
          <User className="h-3 w-3" />
          <span>{comment.poster || comment.user || 'Ẩn danh'}</span>
        </div>
        
        {comment.upvote_count && parseInt(comment.upvote_count) > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-emerald-400/90 font-medium">
            <ThumbsUp className="h-2.5 w-2.5" />
            {comment.upvote_count}
          </span>
        )}
        
        {formattedTime && (
          <span className="flex items-center gap-1 text-[11px] text-slate-500 font-normal">
            <Calendar className="h-2.5 w-2.5" />
            {formattedTime}
          </span>
        )}
      </div>

      <div className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap pl-1 mb-2">
        {comment.content}
      </div>

      {comment.comments && comment.comments.length > 0 && (
        <div className="pl-4 sm:pl-5 border-l-2 border-slate-700/60 ml-2 mt-2 space-y-1 hover:border-cyan-500/30 transition-colors duration-200">
          {comment.comments.map((childComment) => (
            <CommentNode 
              key={childComment.comment_id || Math.random().toString()} 
              comment={childComment} 
              depth={depth + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface QuestionItemProps {
  question: Question;
  index: number;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  savedAnswers: string[];
  onAnswerSelect: (id: string, selected: string[], isCorrect: boolean) => void;
  hideFeedback?: boolean; // If true, hides correct/incorrect styling and explanation buttons
}

export const QuestionItem: React.FC<QuestionItemProps> = React.memo(({ 
  question, 
  index,
  isBookmarked,
  onToggleBookmark,
  savedAnswers,
  onAnswerSelect,
  hideFeedback = false
}) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyQuestion = async () => {
    const choicesText = question.choices && Object.keys(question.choices).length > 0
      ? Object.entries(question.choices)
          .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
          .map(([key, val]) => `${key}. ${val}`)
          .join('\n')
      : '';

    const copyText = `Question ${question.question_id}
${question.question_text}
${choicesText ? choicesText + '\n' : ''}Đáp án đúng: ${question.answer_ET || question.answer || ''}`;

    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Không thể copy câu hỏi:', err);
    }
  };

  const correctAnswer = question.answer || question.answer_ET || '';
  const isMultipleCorrect = correctAnswer.length > 1;
  const correctKeys = React.useMemo(() => correctAnswer.split(''), [correctAnswer]);

  const showFeedbackNow = React.useMemo(() => {
    if (hideFeedback) return false;
    if (savedAnswers.length === 0) return false;
    if (!isMultipleCorrect) return true;
    
    const hasChosenWrong = savedAnswers.some(k => !correctKeys.includes(k));
    const hasChosenAllCorrect = correctKeys.every(k => savedAnswers.includes(k));
    
    return hasChosenWrong || hasChosenAllCorrect;
  }, [hideFeedback, savedAnswers, isMultipleCorrect, correctKeys]);

  const handleChoiceClick = (choiceKey: string) => {
    let newSelections: string[] = [];
    if (isMultipleCorrect) {
      if (savedAnswers.includes(choiceKey)) {
        newSelections = savedAnswers.filter(a => a !== choiceKey);
      } else {
        newSelections = [...savedAnswers, choiceKey];
      }
    } else {
      newSelections = [choiceKey];
    }

    let isCorrect = false;
    if (isMultipleCorrect) {
      const hasAllCorrect = correctKeys.every(k => newSelections.includes(k));
      const hasNoIncorrect = newSelections.every(k => correctKeys.includes(k));
      isCorrect = hasAllCorrect && hasNoIncorrect;
    } else {
      isCorrect = newSelections[0] === correctAnswer;
    }

    onAnswerSelect(question.id || String(question.question_id), newSelections, isCorrect);
  };

  const hasChoices = question.choices && Object.keys(question.choices).length > 0;
  
  return (
    <div className={`rounded-2xl border bg-slate-900/50 p-6 md:p-8 shadow-xl backdrop-blur-md transition-all duration-300 ${
      savedAnswers.length > 0
        ? 'border-slate-800/80 hover:border-slate-700/80'
        : 'border-slate-800 hover:border-cyan-500/30'
    }`}>
      {/* Header Info */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-4 border-b border-slate-800/85">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-800/80 px-3.5 py-1 text-xs font-semibold tracking-wider text-cyan-400 border border-slate-750">
            Câu {index} (ID: {question.question_id})
          </span>
          {question.topic && (
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Chủ đề: {question.topic}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyQuestion}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              copied
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-900/40 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-350'
            }`}
            title="Sao chép câu hỏi & đáp án đúng"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={() => onToggleBookmark(question.id || String(question.question_id))}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isBookmarked
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                : 'bg-slate-900/40 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-350'
            }`}
            title={isBookmarked ? 'Bỏ đánh dấu câu hỏi này' : 'Đánh dấu để xem lại sau'}
          >
            <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span className="hidden xs:inline">{isBookmarked ? 'Đã lưu' : 'Lưu lại'}</span>
          </button>
        </div>
      </div>

      {/* Question Text */}
      <div className="mb-6">
        <p className="text-base md:text-lg font-medium text-slate-100 leading-relaxed whitespace-pre-wrap">
          {question.question_text}
        </p>

        {/* Question Images */}
        {question.question_images && question.question_images.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl overflow-hidden bg-slate-950/40 p-2 border border-slate-850">
            {question.question_images.map((src, i) => (
              <ImageZoom
                key={i}
                src={src}
                alt={`Question graphic ${i + 1}`}
                className="max-h-96 mx-auto object-contain rounded-lg"
              />
            ))}
          </div>
        )}
      </div>

      {/* Choices / Answers */}
      {hasChoices ? (
        <div className="space-y-3 mb-6">
          {Object.entries(question.choices!)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
            .map(([key, value]) => {
              const isSelected = savedAnswers.includes(key);
              const isThisCorrect = correctAnswer.includes(key);
              
              let btnClass = "border-slate-800 bg-slate-900/30 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40";
              let iconElement = null;

              if (showFeedbackNow) {
                if (isThisCorrect) {
                  btnClass = "border-emerald-500/50 bg-emerald-500/10 text-emerald-300";
                  iconElement = <Check className="h-5 w-5 text-emerald-400 shrink-0" />;
                } else if (isSelected && !isThisCorrect) {
                  btnClass = "border-rose-500/50 bg-rose-500/10 text-rose-300";
                  iconElement = <X className="h-5 w-5 text-rose-400 shrink-0" />;
                }
              } else if (isSelected) {
                btnClass = "border-cyan-500 bg-cyan-500/10 text-cyan-300 ring-2 ring-cyan-500/20";
              }

              // Visual Checkbox/Radio styling
              let indicatorClass = "";
              let indicatorIcon = null;

              if (isMultipleCorrect) {
                // Checkbox style (square-ish)
                if (showFeedbackNow) {
                  if (isThisCorrect) {
                    indicatorClass = "border-emerald-500 bg-emerald-500 text-slate-950";
                    indicatorIcon = <Check className="h-3 w-3 stroke-[3.5]" />;
                  } else if (isSelected && !isThisCorrect) {
                    indicatorClass = "border-rose-500 bg-rose-500 text-slate-950";
                    indicatorIcon = <X className="h-3 w-3 stroke-[3.5]" />;
                  } else {
                    indicatorClass = "border-slate-700 bg-slate-800/40 text-slate-500";
                  }
                } else {
                  if (isSelected) {
                    indicatorClass = "border-cyan-500 bg-cyan-500 text-slate-950";
                    indicatorIcon = <Check className="h-3 w-3 stroke-[3.5]" />;
                  } else {
                    indicatorClass = "border-slate-750 bg-slate-850 group-hover:border-slate-600";
                  }
                }
              } else {
                // Radio style (circle)
                if (showFeedbackNow) {
                  if (isThisCorrect) {
                    indicatorClass = "border-emerald-500 bg-emerald-500 text-slate-950";
                    indicatorIcon = <Check className="h-3 w-3 stroke-[3.5]" />;
                  } else if (isSelected && !isThisCorrect) {
                    indicatorClass = "border-rose-500 bg-rose-500 text-slate-950";
                    indicatorIcon = <X className="h-3 w-3 stroke-[3.5]" />;
                  } else {
                    indicatorClass = "border-slate-700 bg-slate-800/40 text-slate-500";
                  }
                } else {
                  if (isSelected) {
                    indicatorClass = "border-cyan-500 bg-cyan-500 text-slate-950";
                    indicatorIcon = <div className="h-1.5 w-1.5 rounded-full bg-slate-950" />;
                  } else {
                    indicatorClass = "border-slate-750 bg-slate-850 group-hover:border-slate-600";
                  }
                }
              }

              return (
                <button
                  key={key}
                  onClick={() => handleChoiceClick(key)}
                  className={`w-full flex items-center justify-between gap-4 text-left px-5 py-4 rounded-xl border font-medium transition-all duration-200 active:scale-[0.99] group ${btnClass}`}
                >
                  <div className="flex items-start gap-3 w-full">
                    {/* Checkbox / Radio Indicator */}
                    <div className={`flex items-center justify-center h-5 w-5 shrink-0 transition-all mt-0.5 border ${
                      isMultipleCorrect ? 'rounded' : 'rounded-full'
                    } ${indicatorClass}`}>
                      {indicatorIcon}
                    </div>

                    {/* Letter badge */}
                    <span className={`flex items-center justify-center h-6 w-6 rounded-md text-xs font-bold shrink-0 transition-colors ${
                      showFeedbackNow && isThisCorrect 
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                        : showFeedbackNow && isSelected && !isThisCorrect 
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : isSelected
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                            : "bg-slate-800 text-slate-300 border border-slate-750 group-hover:bg-slate-700"
                    }`}>
                      {key}
                    </span>
                    <span className="text-sm md:text-base leading-snug">{value}</span>
                  </div>
                  {iconElement}
                </button>
              );
            })}
        </div>
      ) : (
        // Non-MC question support
        correctAnswer && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-800/30 border border-slate-800 text-slate-300 text-sm">
            <div>
              <span className="font-semibold text-slate-200 mr-2">Đáp án:</span>
              {!hideFeedback ? (
                <code className="bg-slate-950/60 px-2.5 py-1 rounded text-cyan-400 border border-slate-850 font-mono">{correctAnswer}</code>
              ) : (
                <span className="text-slate-450 italic">Sẽ hiển thị sau khi nộp bài</span>
              )}
            </div>
            <button
              onClick={() => handleChoiceClick(correctAnswer)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
                savedAnswers.includes(correctAnswer)
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-cyan-500 text-slate-950 border-cyan-400 hover:bg-cyan-400'
              }`}
            >
              {savedAnswers.includes(correctAnswer) ? '✓ Đã hoàn thành' : 'Đánh dấu hoàn thành'}
            </button>
          </div>
        )
      )}

      {/* Action Buttons (Hidden during active test if hideFeedback is true) */}
      {!hideFeedback && (
        <>
          <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-slate-800/80">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                showExplanation
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <span>Xem giải thích</span>
              {showExplanation ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {question.discussion && question.discussion.length > 0 && (
              <button
                onClick={() => setShowComments(!showComments)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                  showComments
                    ? 'bg-slate-700 text-slate-100 border-slate-600'
                    : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Thảo luận ({question.discussion.length})</span>
                {showComments ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>

          {/* Explanation Section */}
          {showExplanation && (
            <div className="mt-4 p-5 rounded-xl border border-cyan-500/20 bg-cyan-950/5 animate-fade-in space-y-4">
              <h4 className="font-semibold text-cyan-400 text-sm tracking-wider uppercase">Giải thích chi tiết:</h4>
              
              {question.answer_description ? (
                <p className="text-slate-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-mono bg-slate-950/30 p-4 rounded-lg border border-slate-850">
                  {question.answer_description}
                </p>
              ) : (
                <p className="text-slate-400 text-sm italic">Không có giải thích chi tiết bằng văn bản.</p>
              )}

              {question.answer_images && question.answer_images.length > 0 && (
                <div className="grid grid-cols-1 gap-3 rounded-lg overflow-hidden bg-slate-950/40 p-2 border border-slate-850">
                  {question.answer_images.map((src, i) => (
                    <ImageZoom
                      key={i}
                      src={src}
                      alt={`Explanation graphic ${i + 1}`}
                      className="max-h-96 mx-auto object-contain rounded-md"
                    />
                  ))}
                </div>
              )}

              {question.answers_community && question.answers_community.length > 0 && (
                <div className="pt-2">
                  <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Cộng đồng bình chọn:</h5>
                  <div className="flex flex-wrap gap-2">
                    {question.answers_community.map((ans, i) => (
                      <span key={i} className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
                        {ans}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Nested Discussion thread */}
          {showComments && question.discussion && question.discussion.length > 0 && (
            <div className="mt-4 p-5 rounded-xl border border-slate-800 bg-slate-950/40 animate-fade-in">
              <h4 className="font-semibold text-slate-300 text-sm tracking-wider uppercase mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-cyan-400" />
                Luồng thảo luận ({question.discussion.length} ý kiến)
              </h4>
              <div className="space-y-4 divide-y divide-slate-800/80">
                {question.discussion.map((comment) => (
                  <CommentNode 
                    key={comment.comment_id || Math.random().toString()} 
                    comment={comment} 
                    depth={0} 
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
});

QuestionItem.displayName = 'QuestionItem';
export default QuestionItem;

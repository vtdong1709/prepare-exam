'use client';

interface QuestionCardProps {
  question: {
    id: number | string;
    questionText: string;
    choices: Record<string, string>;
    correctAnswer: string;
    questionImages?: string[];
  };
  selectedAnswer: string | null;
  onSelectAnswer: (answer: string) => void;
  isCorrect: boolean;
  showFeedback: boolean;
}

export default function QuestionCard({
  question,
  selectedAnswer,
  onSelectAnswer,
  isCorrect,
  showFeedback
}: QuestionCardProps) {
  const answerOptions = Object.entries(question.choices || {}).map(([key, value]) => ({
    key,
    label: value
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
      {/* Question Number and Text */}
      <div className="mb-8 space-y-4">
        <span className="inline-block text-sm font-medium text-accent">
          Question {question.id}
        </span>
        <h2 className="text-2xl font-semibold leading-relaxed text-balance text-foreground whitespace-pre-wrap">
          {question.questionText}
        </h2>

        {/* Question Images */}
        {question.questionImages && question.questionImages.length > 0 && (
          <div className="mt-4 space-y-4">
            {question.questionImages.map((src, index) => (
              <img
                key={index}
                src={src}
                alt={`Question graphic ${index + 1}`}
                className="max-w-full rounded-lg border border-border"
              />
            ))}
          </div>
        )}
      </div>

      {/* Answer Choices */}
      <div className="space-y-3">
        {answerOptions.map(({ key, label }) => {
          const isSelected = selectedAnswer === key;
          const isAnswerCorrect = key === question.correctAnswer;
          
          let containerClasses =
            'relative w-full rounded-lg border-2 p-4 transition-all cursor-pointer text-left';

          if (!showFeedback) {
            // Before answer is selected
            containerClasses += ` border-border bg-card/50 hover:border-accent/50 hover:bg-card/80`;
          } else {
            // After answer is selected
            if (isAnswerCorrect) {
              // Correct answer - always show green
              containerClasses += ` border-green-500/50 bg-green-500/5 shadow-sm`;
            } else if (isSelected && !isCorrect) {
              // Selected but wrong answer - show red
              containerClasses += ` border-red-500/50 bg-red-500/5 shadow-sm`;
            } else {
              // Not selected
              containerClasses += ` border-border bg-card/50 opacity-60`;
            }
          }

          return (
            <button
              key={key}
              onClick={() => onSelectAnswer(key)}
              disabled={showFeedback}
              className={containerClasses}
            >
              <div className="flex gap-4">
                {/* Answer Letter */}
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg font-semibold transition-all ${
                    !showFeedback
                      ? 'bg-muted text-muted-foreground'
                      : isAnswerCorrect
                        ? 'bg-green-500/20 text-green-400'
                        : isSelected && !isCorrect
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-muted text-muted-foreground opacity-60'
                  }`}
                >
                  {key}
                </div>

                {/* Answer Text */}
                <div className="flex-1 text-left">
                  <p className="leading-relaxed text-foreground">{label}</p>
                </div>

                {/* Feedback Icons */}
                {showFeedback && (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
                    {isAnswerCorrect && (
                      <span className="text-lg text-green-400">✓</span>
                    )}
                    {isSelected && !isCorrect && (
                      <span className="text-lg text-red-400">✗</span>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}


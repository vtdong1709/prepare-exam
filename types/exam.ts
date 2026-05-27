export interface Comment {
  timestamp: string;
  upvote_count?: string;
  content: string;
  comment_id: string;
  poster?: string;
  user?: string;
  comments?: Comment[];
}

export interface Question {
  id: string;
  exam_id: number;
  topic?: string | null;
  timestamp?: string;
  answer: string;
  isMC: boolean;
  answers_community?: string[];
  url?: string;
  discussion?: Comment[];
  answer_ET?: string;
  answer_description?: string;
  answer_images?: string[];
  question_text: string;
  question_id: number;
  unix_timestamp?: number;
  question_images?: string[];
  choices?: Record<string, string>;
}

export interface ExamData {
  pageProps: {
    questions: Question[];
  };
}

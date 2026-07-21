export type Attempt = {
  id: string;
  userId: string;
  kana: string;
  translation: string;
  expected: string;
  answer: string;
  correct: boolean;
  kanaCount: number;
  correctKana: number;
  durationMs: number;
  kanaPerMinute: number;
  kanaBreakdown: { kana: string; correct: boolean }[];
  createdAt: string;
};

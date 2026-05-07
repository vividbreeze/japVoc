export interface Word {
  id: string;
  hiragana: string;
  katakana?: string | null;
  kanji?: string | null;
  romaji?: string | null;
  deutsch: string;
  beispielsatz_jp?: string | null;
  beispielsatz_de?: string | null;
  wortart: string;
  jlpt_level: string;
  createdAt: string;
  progress?: WordProgress | null;
}

export interface WordProgress {
  id: string;
  wordId: string;
  repetitions: number;
  easinessFactor: number;
  intervalDays: number;
  nextReviewDate: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  name: string;
  beschreibung?: string | null;
  isDefault: boolean;
  createdAt: string;
  _count?: { words: number };
}

export interface ReviewQueue {
  queue: Word[];
  stats: {
    due: number;
    new: number;
    total: number;
  };
}

export interface ReviewResult {
  id: string;
  wordId: string;
  repetitions: number;
  easinessFactor: number;
  intervalDays: number;
  nextReviewDate: string;
}

export interface Stats {
  totalWords: number;
  learnedCount: number;
  newCount: number;
  dueToday: number;
  streak: number;
  percentageLearned: number;
  distribution: {
    new: number;
    learning: number;
    review: number;
    master: number;
  };
  dailyHistory: { date: string; cardsStudied: number }[];
}

export interface Settings {
  id: string;
  lernrichtung: 'jp_to_de' | 'de_to_jp';
  // Japanese side (front in jp_to_de, back in de_to_jp)
  frontShowHiragana: boolean;
  frontShowKanji: boolean;
  frontShowRomaji: boolean;
  // Back side
  showExampleSentence: boolean;
  newWordsPerDay: number;
}

export type Rating = 0 | 1 | 2 | 3;

export type WordStatus = 'new' | 'learning' | 'review' | 'master';

export function getWordStatus(progress?: WordProgress | null): WordStatus {
  if (!progress || progress.repetitions === 0) return 'new';
  if (progress.intervalDays <= 1) return 'learning';
  if (progress.intervalDays < 21) return 'review';
  return 'master';
}

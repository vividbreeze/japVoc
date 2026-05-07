export interface SM2Input {
  repetitions: number;
  easinessFactor: number;
  intervalDays: number;
  rating: number; // 0=Again, 1=Hard, 2=Good, 3=Easy
}

export interface SM2Result {
  repetitions: number;
  easinessFactor: number;
  intervalDays: number;
  nextReviewDate: Date;
}

// Map app ratings (0-3) to SM-2 quality score (0-5)
const QUALITY_MAP: Record<number, number> = { 0: 0, 1: 3, 2: 4, 3: 5 };

export function calculateSM2(input: SM2Input): SM2Result {
  const { repetitions, easinessFactor, intervalDays, rating } = input;
  const q = QUALITY_MAP[rating] ?? 0;

  let newRepetitions = repetitions;
  let newInterval = intervalDays;

  if (q < 3) {
    // Failed recall – restart
    newRepetitions = 0;
    newInterval = 1;
  } else {
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(intervalDays * easinessFactor);
    }
    newRepetitions = repetitions + 1;
  }

  // EF update (minimum 1.3)
  let newEF = easinessFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (newEF < 1.3) newEF = 1.3;

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
  nextReviewDate.setHours(0, 0, 0, 0);

  return {
    repetitions: newRepetitions,
    easinessFactor: Math.round(newEF * 10000) / 10000,
    intervalDays: newInterval,
    nextReviewDate,
  };
}

export function getWordStatus(repetitions: number, intervalDays: number): 'new' | 'learning' | 'review' | 'master' {
  if (repetitions === 0) return 'new';
  if (intervalDays <= 1) return 'learning';
  if (intervalDays < 21) return 'review';
  return 'master';
}

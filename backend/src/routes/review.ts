import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import prisma from '../db';
import { calculateSM2 } from '../services/sm2';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const router = Router();

// GET /api/review/queue?collectionId=X
router.get('/queue', async (req: Request, res: Response) => {
  try {
    const { collectionId } = req.query as { collectionId?: string };

    const wordFilter: Record<string, unknown> = {};
    if (collectionId) {
      wordFilter.collections = { some: { collectionId } };
    }

    // Fetch all words in the collection
    const allWords = await prisma.word.findMany({ where: wordFilter });

    if (allWords.length === 0) {
      return res.json({ queue: [], stats: { due: 0, new: 0, total: 0 } });
    }

    // Fetch progress for all these words
    const wordIds = allWords.map((w) => w.id);
    const progressRecords = await prisma.wordProgress.findMany({
      where: { wordId: { in: wordIds } },
    });
    const progressMap = new Map(progressRecords.map((p) => [p.wordId, p]));

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Classify each word
    const newWords: typeof allWords = [];
    const dueWords: typeof allWords = [];
    const futureWords: typeof allWords = [];

    for (const word of allWords) {
      const p = progressMap.get(word.id);
      if (!p || p.repetitions === 0) {
        newWords.push(word);
      } else if (p.nextReviewDate <= today) {
        dueWords.push(word);
      } else {
        futureWords.push(word);
      }
    }

    // Sort future words worst-first (lowest easinessFactor = hardest)
    futureWords.sort((a, b) => {
      const pa = progressMap.get(a.id)!;
      const pb = progressMap.get(b.id)!;
      return pa.easinessFactor - pb.easinessFactor;
    });

    // Queue: due (shuffled) → new (shuffled) → future worst-first
    const queue = [...shuffle(dueWords), ...shuffle(newWords), ...futureWords];

    res.json({
      queue,
      stats: {
        due: dueWords.length,
        new: newWords.length,
        total: queue.length,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to build review queue' });
  }
});

// POST /api/review
router.post('/', async (req: Request, res: Response) => {
  try {
    const { wordId, rating } = req.body as { wordId?: string; rating?: number };
    if (!wordId || rating === undefined) return res.status(400).json({ error: 'wordId and rating are required' });
    if (![0, 1, 2, 3].includes(rating)) return res.status(400).json({ error: 'rating must be 0-3' });

    const word = await prisma.word.findUnique({ where: { id: wordId } });
    if (!word) return res.status(404).json({ error: 'Word not found' });

    const progress = await prisma.wordProgress.findUnique({ where: { wordId } });

    const sm2Result = calculateSM2({
      repetitions: progress?.repetitions ?? 0,
      easinessFactor: progress?.easinessFactor ?? 2.5,
      intervalDays: progress?.intervalDays ?? 0,
      rating,
    });

    // Upsert progress
    const updatedProgress = await prisma.wordProgress.upsert({
      where: { wordId },
      create: {
        id: randomUUID(),
        wordId,
        ...sm2Result,
      },
      update: sm2Result,
    });

    // Store review history
    await prisma.review.create({
      data: {
        id: randomUUID(),
        wordId,
        rating,
        repetitions: sm2Result.repetitions,
        easinessFactor: sm2Result.easinessFactor,
        intervalDays: sm2Result.intervalDays,
        nextReviewDate: sm2Result.nextReviewDate,
      },
    });

    // Update daily learning log
    const dateStr = new Date().toISOString().split('T')[0];
    await prisma.learningDay.upsert({
      where: { date: dateStr },
      create: { id: randomUUID(), date: dateStr, cardsStudied: 1 },
      update: { cardsStudied: { increment: 1 } },
    });

    res.json(updatedProgress);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save review' });
  }
});

export default router;

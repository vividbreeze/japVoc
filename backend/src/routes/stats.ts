import { Router, Request, Response } from 'express';
import prisma from '../db';
import { getWordStatus } from '../services/sm2';

const router = Router();

// GET /api/stats
router.get('/', async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const totalWords = await prisma.word.count();

    // Cards due today
    const dueToday = await prisma.wordProgress.count({
      where: { nextReviewDate: { lte: today }, repetitions: { gt: 0 } },
    });

    // New words (never reviewed)
    const learnedCount = await prisma.wordProgress.count({ where: { repetitions: { gt: 0 } } });
    const newCount = totalWords - learnedCount;

    // Distribution by status
    const allProgress = await prisma.wordProgress.findMany();
    const distribution = { new: newCount, learning: 0, review: 0, master: 0 };
    for (const p of allProgress) {
      const status = getWordStatus(p.repetitions, p.intervalDays);
      if (status !== 'new') distribution[status]++;
    }

    // Streak calculation
    const learningDays = await prisma.learningDay.findMany({
      orderBy: { date: 'desc' },
    });

    let streak = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const dates = new Set(learningDays.map((d) => d.date));

    let checkDate = new Date();
    // If nothing today yet, start from yesterday for streak check
    if (!dates.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (!dates.has(dateStr)) break;
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Daily history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const recentDays = learningDays.filter((d) => d.date >= thirtyDaysAgoStr);

    // Fill in missing days with 0
    const dailyHistory: { date: string; cardsStudied: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = recentDays.find((r) => r.date === dateStr);
      dailyHistory.push({ date: dateStr, cardsStudied: found?.cardsStudied ?? 0 });
    }

    res.json({
      totalWords,
      learnedCount,
      newCount,
      dueToday,
      streak,
      distribution,
      dailyHistory,
      percentageLearned: totalWords > 0 ? Math.round((learnedCount / totalWords) * 100) : 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;

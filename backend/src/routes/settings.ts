import { Router, Request, Response } from 'express';
import prisma from '../db';

const router = Router();

// GET /api/settings
router.get('/', async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.settings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        frontSide: 'hiragana',
        showHiragana: true,
        showKanji: true,
        showExampleSentence: true,
        newWordsPerDay: 20,
      },
      update: {},
    });
    res.json(settings);
  } catch {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings
router.put('/', async (req: Request, res: Response) => {
  try {
    const { frontSide, showHiragana, showKanji, showExampleSentence, newWordsPerDay } = req.body as {
      frontSide?: string;
      showHiragana?: boolean;
      showKanji?: boolean;
      showExampleSentence?: boolean;
      newWordsPerDay?: number;
    };

    const validFrontSides = ['hiragana', 'kanji', 'deutsch'];
    if (frontSide && !validFrontSides.includes(frontSide)) {
      return res.status(400).json({ error: 'Invalid frontSide value' });
    }

    const updated = await prisma.settings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        frontSide: frontSide ?? 'hiragana',
        showHiragana: showHiragana ?? true,
        showKanji: showKanji ?? true,
        showExampleSentence: showExampleSentence ?? true,
        newWordsPerDay: newWordsPerDay ?? 20,
      },
      update: {
        ...(frontSide !== undefined && { frontSide }),
        ...(showHiragana !== undefined && { showHiragana }),
        ...(showKanji !== undefined && { showKanji }),
        ...(showExampleSentence !== undefined && { showExampleSentence }),
        ...(newWordsPerDay !== undefined && { newWordsPerDay }),
      },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;

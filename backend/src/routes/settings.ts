import { Router, Request, Response } from 'express';
import prisma from '../db';

const router = Router();

// GET /api/settings
router.get('/', async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.settings.upsert({
      where: { id: 'default' },
      create: { id: 'default' },
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
    const {
      frontShowHiragana, frontShowKanji, frontShowRomaji, frontShowExampleJp,
      showHiragana, showKanji, showExampleSentence, newWordsPerDay,
    } = req.body as {
      frontShowHiragana?: boolean;
      frontShowKanji?: boolean;
      frontShowRomaji?: boolean;
      frontShowExampleJp?: boolean;
      showHiragana?: boolean;
      showKanji?: boolean;
      showExampleSentence?: boolean;
      newWordsPerDay?: number;
    };

    const updated = await prisma.settings.upsert({
      where: { id: 'default' },
      create: { id: 'default' },
      update: {
        ...(frontShowHiragana !== undefined && { frontShowHiragana }),
        ...(frontShowKanji    !== undefined && { frontShowKanji }),
        ...(frontShowRomaji   !== undefined && { frontShowRomaji }),
        ...(frontShowExampleJp !== undefined && { frontShowExampleJp }),
        ...(showHiragana      !== undefined && { showHiragana }),
        ...(showKanji         !== undefined && { showKanji }),
        ...(showExampleSentence !== undefined && { showExampleSentence }),
        ...(newWordsPerDay    !== undefined && { newWordsPerDay }),
      },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;

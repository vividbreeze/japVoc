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
      lernrichtung,
      frontShowHiragana, frontShowKanji, frontShowRomaji, frontShowExampleJp,
      showExampleSentence, newWordsPerDay,
    } = req.body as {
      lernrichtung?: string;
      frontShowHiragana?: boolean;
      frontShowKanji?: boolean;
      frontShowRomaji?: boolean;
      frontShowExampleJp?: boolean;
      showExampleSentence?: boolean;
      newWordsPerDay?: number;
    };

    if (lernrichtung && !['jp_to_de', 'de_to_jp'].includes(lernrichtung)) {
      return res.status(400).json({ error: 'Invalid lernrichtung value' });
    }

    const updated = await prisma.settings.upsert({
      where: { id: 'default' },
      create: { id: 'default' },
      update: {
        ...(lernrichtung        !== undefined && { lernrichtung }),
        ...(frontShowHiragana   !== undefined && { frontShowHiragana }),
        ...(frontShowKanji      !== undefined && { frontShowKanji }),
        ...(frontShowRomaji     !== undefined && { frontShowRomaji }),
        ...(frontShowExampleJp  !== undefined && { frontShowExampleJp }),
        ...(showExampleSentence !== undefined && { showExampleSentence }),
        ...(newWordsPerDay      !== undefined && { newWordsPerDay }),
      },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;

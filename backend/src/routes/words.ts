import { Router, Request, Response } from 'express';
import prisma from '../db';

const router = Router();

// GET /api/words
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, wortart, collectionId, page = '1', limit = '50' } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { hiragana: { contains: search } },
        { kanji: { contains: search } },
        { deutsch: { contains: search } },
      ];
    }

    if (wortart) {
      where.wortart = { contains: wortart };
    }

    if (collectionId) {
      where.collections = {
        some: { collectionId },
      };
    }

    const [words, total] = await Promise.all([
      prisma.word.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { hiragana: 'asc' },
        include: {
          progress: true,
        },
      }),
      prisma.word.count({ where }),
    ]);

    res.json({ words, total, page: pageNum, limit: limitNum });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch words' });
  }
});

// GET /api/words/wortarten
router.get('/wortarten', async (_req: Request, res: Response) => {
  try {
    const words = await prisma.word.findMany({ select: { wortart: true }, distinct: ['wortart'] });
    const wortarten = words.map((w) => w.wortart).sort();
    res.json(wortarten);
  } catch {
    res.status(500).json({ error: 'Failed to fetch word types' });
  }
});

// GET /api/words/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const word = await prisma.word.findUnique({
      where: { id: req.params.id },
      include: { progress: true },
    });
    if (!word) return res.status(404).json({ error: 'Word not found' });
    res.json(word);
  } catch {
    res.status(500).json({ error: 'Failed to fetch word' });
  }
});

export default router;

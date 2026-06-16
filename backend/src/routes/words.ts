import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
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
        include: { progress: true },
      }),
      prisma.word.count({ where }),
    ]);

    res.json({ words, total, page: pageNum, limit: limitNum });
  } catch {
    res.status(500).json({ error: 'Failed to fetch words' });
  }
});

// GET /api/words/wortarten  — must be before /:id
router.get('/wortarten', async (_req: Request, res: Response) => {
  try {
    const words = await prisma.word.findMany({ select: { wortart: true }, distinct: ['wortart'] });
    res.json(words.map((w) => w.wortart).sort());
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

// POST /api/words
router.post('/', async (req: Request, res: Response) => {
  try {
    const { hiragana, kanji, romaji, deutsch, wortart, beispielsatz_jp, beispielsatz_de, collectionId } = req.body as Record<string, string | undefined>;

    if (!hiragana?.trim() || !deutsch?.trim() || !wortart?.trim()) {
      return res.status(400).json({ error: 'hiragana, deutsch und wortart sind erforderlich' });
    }

    const defaultCollection = await prisma.collection.findFirst({ where: { isDefault: true } });

    const collectionsToAdd: { collectionId: string }[] = [];
    if (defaultCollection) collectionsToAdd.push({ collectionId: defaultCollection.id });
    if (collectionId && collectionId !== defaultCollection?.id) {
      collectionsToAdd.push({ collectionId });
    }

    const word = await prisma.word.create({
      data: {
        id: randomUUID(),
        hiragana: hiragana.trim(),
        kanji: kanji?.trim() || null,
        romaji: romaji?.trim() || null,
        deutsch: deutsch.trim(),
        wortart: wortart.trim(),
        beispielsatz_jp: beispielsatz_jp?.trim() || null,
        beispielsatz_de: beispielsatz_de?.trim() || null,
        jlpt_level: 'N5',
        collections: { create: collectionsToAdd },
      },
      include: { progress: true },
    });

    res.status(201).json(word);
  } catch {
    res.status(500).json({ error: 'Failed to create word' });
  }
});

// PUT /api/words/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { hiragana, kanji, romaji, deutsch, wortart, beispielsatz_jp, beispielsatz_de } = req.body as Record<string, string | undefined>;

    if (!hiragana?.trim() || !deutsch?.trim() || !wortart?.trim()) {
      return res.status(400).json({ error: 'hiragana, deutsch und wortart sind erforderlich' });
    }

    const word = await prisma.word.update({
      where: { id: req.params.id },
      data: {
        hiragana: hiragana.trim(),
        kanji: kanji?.trim() || null,
        romaji: romaji?.trim() || null,
        deutsch: deutsch.trim(),
        wortart: wortart.trim(),
        beispielsatz_jp: beispielsatz_jp?.trim() || null,
        beispielsatz_de: beispielsatz_de?.trim() || null,
      },
      include: { progress: true },
    });

    res.json(word);
  } catch {
    res.status(500).json({ error: 'Failed to update word' });
  }
});

// DELETE /api/words/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.word.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete word' });
  }
});

export default router;

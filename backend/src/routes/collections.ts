import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import prisma from '../db';

const router = Router();

// GET /api/collections
router.get('/', async (_req: Request, res: Response) => {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      include: { _count: { select: { words: true } } },
    });
    res.json(collections);
  } catch {
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// POST /api/collections
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, beschreibung } = req.body as { name?: string; beschreibung?: string };
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    const collection = await prisma.collection.create({
      data: { id: randomUUID(), name: name.trim(), beschreibung: beschreibung?.trim() ?? null },
    });
    res.status(201).json(collection);
  } catch {
    res.status(500).json({ error: 'Failed to create collection' });
  }
});

// PUT /api/collections/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, beschreibung } = req.body as { name?: string; beschreibung?: string };
    const existing = await prisma.collection.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Collection not found' });
    if (existing.isDefault) return res.status(403).json({ error: 'Default collection cannot be renamed' });
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    const updated = await prisma.collection.update({
      where: { id: req.params.id },
      data: { name: name.trim(), beschreibung: beschreibung?.trim() ?? null },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update collection' });
  }
});

// DELETE /api/collections/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await prisma.collection.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Collection not found' });
    if (existing.isDefault) return res.status(403).json({ error: 'Default collection cannot be deleted' });

    await prisma.collection.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

// GET /api/collections/:id/words
router.get('/:id/words', async (req: Request, res: Response) => {
  try {
    const { search, wortart } = req.query as Record<string, string>;

    const collection = await prisma.collection.findUnique({ where: { id: req.params.id } });
    if (!collection) return res.status(404).json({ error: 'Collection not found' });

    const wordFilter: Record<string, unknown> = {};
    if (search) {
      wordFilter.OR = [
        { hiragana: { contains: search } },
        { kanji: { contains: search } },
        { deutsch: { contains: search } },
      ];
    }
    if (wortart) wordFilter.wortart = { contains: wortart };

    const entries = await prisma.collectionWord.findMany({
      where: { collectionId: req.params.id, word: wordFilter },
      include: { word: { include: { progress: true } } },
      orderBy: { word: { hiragana: 'asc' } },
    });

    res.json(entries.map((e) => e.word));
  } catch {
    res.status(500).json({ error: 'Failed to fetch words' });
  }
});

// POST /api/collections/:id/words
router.post('/:id/words', async (req: Request, res: Response) => {
  try {
    const { wordId } = req.body as { wordId?: string };
    if (!wordId) return res.status(400).json({ error: 'wordId is required' });

    const [collection, word] = await Promise.all([
      prisma.collection.findUnique({ where: { id: req.params.id } }),
      prisma.word.findUnique({ where: { id: wordId } }),
    ]);
    if (!collection) return res.status(404).json({ error: 'Collection not found' });
    if (!word) return res.status(404).json({ error: 'Word not found' });

    const entry = await prisma.collectionWord.upsert({
      where: { collectionId_wordId: { collectionId: req.params.id, wordId } },
      create: { collectionId: req.params.id, wordId },
      update: {},
    });
    res.status(201).json(entry);
  } catch {
    res.status(500).json({ error: 'Failed to add word' });
  }
});

// DELETE /api/collections/:id/words/:wordId
router.delete('/:id/words/:wordId', async (req: Request, res: Response) => {
  try {
    const collection = await prisma.collection.findUnique({ where: { id: req.params.id } });
    if (!collection) return res.status(404).json({ error: 'Collection not found' });
    if (collection.isDefault) return res.status(403).json({ error: 'Cannot remove words from default collection' });

    await prisma.collectionWord.delete({
      where: { collectionId_wordId: { collectionId: req.params.id, wordId: req.params.wordId } },
    });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to remove word' });
  }
});

export default router;

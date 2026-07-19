import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import prisma from '../db';

const router = Router();

// GET /api/backup/export
router.get('/export', async (_req: Request, res: Response) => {
  try {
    const [words, collections, collectionWords, progress] = await Promise.all([
      prisma.word.findMany(),
      prisma.collection.findMany(),
      prisma.collectionWord.findMany(),
      prisma.wordProgress.findMany(),
    ]);

    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      words,
      collections,
      collectionWords,
      progress,
    };

    const filename = `japvoc-backup-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(backup);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Export failed' });
  }
});

// POST /api/backup/import
router.post('/import', async (req: Request, res: Response) => {
  try {
    const { version, words, collections, collectionWords, progress } = req.body as {
      version: number;
      words: { id: string; hiragana: string; kanji?: string | null; romaji?: string | null; deutsch: string; beispielsatz_jp?: string | null; beispielsatz_de?: string | null; wortart: string; jlpt_level: string }[];
      collections: { id: string; name: string; beschreibung?: string | null; isDefault: boolean }[];
      collectionWords: { collectionId: string; wordId: string }[];
      progress: { wordId: string; repetitions: number; easinessFactor: number; intervalDays: number; nextReviewDate: string }[];
    };

    if (!version || !words || !collections) {
      return res.status(400).json({ error: 'Invalid backup format' });
    }

    // Replace mode: wipe all existing data before importing
    if (req.body.mode === 'replace') {
      await prisma.review.deleteMany();
      await prisma.wordProgress.deleteMany();
      await prisma.collectionWord.deleteMany();
      await prisma.collection.deleteMany({ where: { isDefault: false } });
      await prisma.word.deleteMany();
    }

    // Map exported word IDs → actual DB word IDs
    const wordIdMap = new Map<string, string>();
    let wordsCreated = 0;

    for (const word of words) {
      const existing = await prisma.word.findFirst({
        where: { hiragana: word.hiragana, deutsch: word.deutsch },
      });
      if (existing) {
        wordIdMap.set(word.id, existing.id);
      } else {
        const created = await prisma.word.create({
          data: {
            id: randomUUID(),
            hiragana: word.hiragana,
            kanji: word.kanji ?? null,
            romaji: word.romaji ?? null,
            deutsch: word.deutsch,
            beispielsatz_jp: word.beispielsatz_jp ?? null,
            beispielsatz_de: word.beispielsatz_de ?? null,
            wortart: word.wortart,
            jlpt_level: word.jlpt_level,
          },
        });
        wordIdMap.set(word.id, created.id);
        wordsCreated++;
      }
    }

    // Map exported collection IDs → actual DB collection IDs
    const collectionIdMap = new Map<string, string>();
    let collectionsCreated = 0;

    for (const col of collections) {
      if (col.isDefault) {
        const existing = await prisma.collection.findFirst({ where: { isDefault: true } });
        if (existing) collectionIdMap.set(col.id, existing.id);
        continue;
      }
      let existing = await prisma.collection.findFirst({ where: { name: col.name, isDefault: false } });
      if (!existing) {
        existing = await prisma.collection.create({
          data: { id: randomUUID(), name: col.name, beschreibung: col.beschreibung ?? null, isDefault: false },
        });
        collectionsCreated++;
      }
      collectionIdMap.set(col.id, existing.id);
    }

    // Restore collection-word relationships
    for (const cw of collectionWords) {
      const actualCollectionId = collectionIdMap.get(cw.collectionId);
      const actualWordId = wordIdMap.get(cw.wordId);
      if (!actualCollectionId || !actualWordId) continue;
      await prisma.collectionWord.upsert({
        where: { collectionId_wordId: { collectionId: actualCollectionId, wordId: actualWordId } },
        create: { collectionId: actualCollectionId, wordId: actualWordId },
        update: {},
      });
    }

    // Restore learning progress
    let progressRestored = 0;
    for (const p of progress) {
      const actualWordId = wordIdMap.get(p.wordId);
      if (!actualWordId) continue;
      await prisma.wordProgress.upsert({
        where: { wordId: actualWordId },
        create: {
          id: randomUUID(),
          wordId: actualWordId,
          repetitions: p.repetitions,
          easinessFactor: p.easinessFactor,
          intervalDays: p.intervalDays,
          nextReviewDate: new Date(p.nextReviewDate),
        },
        update: {
          repetitions: p.repetitions,
          easinessFactor: p.easinessFactor,
          intervalDays: p.intervalDays,
          nextReviewDate: new Date(p.nextReviewDate),
        },
      });
      progressRestored++;
    }

    res.json({
      success: true,
      wordsCreated,
      collectionsCreated,
      progressRestored,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Import failed' });
  }
});

export default router;

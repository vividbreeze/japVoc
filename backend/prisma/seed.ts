import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface SeedWord {
  hiragana: string;
  kanji: string | null;
  romaji: string | null;
  deutsch: string;
  beispielsatz_jp: string | null;
  beispielsatz_de: string | null;
  wortart: string;
}

export async function seedIfEmpty() {
  const wordCount = await prisma.word.count();
  if (wordCount > 0) {
    console.log(`ℹ️  Database already has ${wordCount} words — skipping seed.`);
    return;
  }

  console.log('🌱 Empty database detected, seeding N5 vocabulary...');

  // Works both in dev (tsx prisma/seed.ts, cwd=backend/) and
  // production (node dist/src/index.js, cwd=/app)
  const vocabPath = path.join(process.cwd(), 'prisma', 'seed', 'n5-vocabulary.json');
  const vocab: SeedWord[] = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));

  const batchSize = 100;
  const wordIds: string[] = [];
  for (let i = 0; i < vocab.length; i += batchSize) {
    const batch = vocab.slice(i, i + batchSize);
    for (const w of batch) {
      const id = randomUUID();
      wordIds.push(id);
      await prisma.word.create({
        data: {
          id,
          hiragana: w.hiragana,
          kanji: w.kanji ?? null,
          romaji: w.romaji ?? null,
          deutsch: w.deutsch,
          beispielsatz_jp: w.beispielsatz_jp ?? null,
          beispielsatz_de: w.beispielsatz_de ?? null,
          wortart: w.wortart,
          jlpt_level: 'N5',
        },
      });
    }
    console.log(`  Inserted ${Math.min(i + batchSize, vocab.length)}/${vocab.length}`);
  }

  const defaultCollection = await prisma.collection.create({
    data: {
      id: randomUUID(),
      name: 'Gesamtwortschatz N5',
      beschreibung: 'Alle JLPT-N5-Vokabeln',
      isDefault: true,
    },
  });

  for (const wordId of wordIds) {
    await prisma.collectionWord.create({
      data: { collectionId: defaultCollection.id, wordId },
    });
  }

  const existingSettings = await prisma.settings.findUnique({ where: { id: 'default' } });
  if (!existingSettings) {
    await prisma.settings.create({ data: { id: 'default' } });
  }

  console.log(`✅ Seed complete. ${vocab.length} words, 1 default collection.`);
}

// Allow running directly: tsx prisma/seed.ts
// Pass --force to wipe and re-seed (for development resets only)
async function main() {
  const force = process.argv.includes('--force');

  if (force) {
    console.log('⚠️  --force: wiping all data and re-seeding...');
    await prisma.review.deleteMany();
    await prisma.wordProgress.deleteMany();
    await prisma.collectionWord.deleteMany();
    await prisma.collection.deleteMany();
    await prisma.word.deleteMany();
    await prisma.settings.deleteMany();
    await prisma.learningDay.deleteMany();
  }

  await seedIfEmpty();
}

// Only run when executed directly (tsx prisma/seed.ts), not when imported
if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Seed failed:', e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

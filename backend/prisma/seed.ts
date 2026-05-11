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
  wortart: string;
  kategorien: string[];
  beispielsatz_jp: string | null;
  beispielsatz_de: string | null;
}

export async function seedIfEmpty() {
  const wordCount = await prisma.word.count();
  if (wordCount > 0) {
    console.log(`ℹ️  Database already has ${wordCount} words — skipping seed.`);
    return;
  }

  console.log('🌱 Empty database detected, seeding N5 vocabulary...');

  const vocabPath = path.join(process.cwd(), 'prisma', 'seed', 'n5-vocabulary.json');
  const vocab: SeedWord[] = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));

  const wordIds = vocab.map(() => randomUUID());

  // Collect all unique category names
  const categoryNames = [...new Set(vocab.flatMap((w) => w.kategorien))].sort();

  // Map category name → new UUID
  const categoryIdMap = new Map<string, string>(
    categoryNames.map((name) => [name, randomUUID()])
  );

  const defaultCollectionId = randomUUID();

  // 1. Insert all words
  await prisma.word.createMany({
    data: vocab.map((w, i) => ({
      id: wordIds[i],
      hiragana: w.hiragana,
      kanji: w.kanji ?? null,
      romaji: w.romaji ?? null,
      deutsch: w.deutsch,
      beispielsatz_jp: w.beispielsatz_jp ?? null,
      beispielsatz_de: w.beispielsatz_de ?? null,
      wortart: w.wortart,
      jlpt_level: 'N5',
    })),
  });

  // 2. Create default collection with all words
  await prisma.collection.create({
    data: {
      id: defaultCollectionId,
      name: 'Gesamtwortschatz N5',
      beschreibung: 'Alle JLPT-N5-Vokabeln',
      isDefault: true,
      words: { create: wordIds.map((wordId) => ({ wordId })) },
    },
  });

  // 3. Create category collections
  for (const name of categoryNames) {
    const id = categoryIdMap.get(name)!;
    const wordsInCategory = vocab
      .map((w, i) => ({ kategorien: w.kategorien, wordId: wordIds[i] }))
      .filter((w) => w.kategorien.includes(name));

    await prisma.collection.create({
      data: {
        id,
        name,
        beschreibung: null,
        isDefault: false,
        words: { create: wordsInCategory.map((w) => ({ wordId: w.wordId })) },
      },
    });

    console.log(`  📁 ${name}: ${wordsInCategory.length} Wörter`);
  }

  // 4. Default settings
  await prisma.settings.upsert({
    where: { id: 'default' },
    create: { id: 'default' },
    update: {},
  });

  console.log(`✅ Seed complete. ${vocab.length} words, 1 default + ${categoryNames.length} category collections.`);
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

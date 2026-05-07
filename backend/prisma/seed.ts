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

async function main() {
  console.log('🌱 Starting database seed...');

  const vocabPath = path.join(__dirname, 'seed', 'n5-vocabulary.json');
  const vocab: SeedWord[] = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));

  // Clear existing data in order
  await prisma.review.deleteMany();
  await prisma.wordProgress.deleteMany();
  await prisma.collectionWord.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.word.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.learningDay.deleteMany();

  console.log(`📚 Inserting ${vocab.length} words...`);

  // Insert words in batches
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

  // Create default collection containing all words
  const defaultCollection = await prisma.collection.create({
    data: {
      id: randomUUID(),
      name: 'Gesamtwortschatz N5',
      beschreibung: 'Alle JLPT-N5-Vokabeln',
      isDefault: true,
    },
  });

  // Add all words to default collection
  for (const wordId of wordIds) {
    await prisma.collectionWord.create({
      data: {
        collectionId: defaultCollection.id,
        wordId,
      },
    });
  }

  // Default settings
  await prisma.settings.create({
    data: { id: 'default' },
  });

  console.log(`✅ Seed complete. ${vocab.length} words, 1 default collection.`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

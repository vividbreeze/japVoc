import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const TEST_DB_PATH = path.join(__dirname, '../data/test.db');
const TEST_DB_URL = `file:${TEST_DB_PATH}`;

// Configure test database before importing app
process.env.DATABASE_URL = TEST_DB_URL;
process.env.NODE_ENV = 'test';

// Import app after env is set
// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require('../src/index').default;
const prisma = new PrismaClient({ datasources: { db: { url: TEST_DB_URL } } });

beforeAll(async () => {
  // Run migrations on test db
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe',
  });

  // Seed minimal test data
  const wordId = randomUUID();
  await prisma.word.create({
    data: {
      id: wordId,
      hiragana: 'てすと',
      kanji: 'テスト',
      deutsch: 'Test',
      wortart: 'Substantiv',
      jlpt_level: 'N5',
    },
  });

  await prisma.collection.create({
    data: { id: randomUUID(), name: 'Gesamtwortschatz N5', isDefault: true },
  });

  await prisma.settings.create({ data: { id: 'default' } });
});

afterAll(async () => {
  await prisma.$disconnect();
  // Clean up test database
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
  const journalPath = `${TEST_DB_PATH}-journal`;
  if (fs.existsSync(journalPath)) fs.unlinkSync(journalPath);
});

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /api/words', () => {
  it('returns paginated word list', async () => {
    const res = await request(app).get('/api/words');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('words');
    expect(res.body).toHaveProperty('total');
    expect(Array.isArray(res.body.words)).toBe(true);
  });

  it('filters by search', async () => {
    const res = await request(app).get(`/api/words?search=${encodeURIComponent('てすと')}`);
    expect(res.status).toBe(200);
    expect(res.body.words.length).toBeGreaterThan(0);
  });
});

describe('Collections CRUD', () => {
  let collectionId: string;

  it('POST /api/collections creates a collection', async () => {
    const res = await request(app).post('/api/collections').send({ name: 'Test Sammlung', beschreibung: 'Nur ein Test' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Sammlung');
    collectionId = res.body.id;
  });

  it('GET /api/collections lists all collections', async () => {
    const res = await request(app).get('/api/collections');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((c: { id: string }) => c.id === collectionId)).toBe(true);
  });

  it('PUT /api/collections/:id renames collection', async () => {
    const res = await request(app).put(`/api/collections/${collectionId}`).send({ name: 'Umbenannt' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Umbenannt');
  });

  it('DELETE /api/collections/:id deletes collection', async () => {
    const res = await request(app).delete(`/api/collections/${collectionId}`);
    expect(res.status).toBe(204);
  });

  it('cannot delete default collection', async () => {
    const collections = await request(app).get('/api/collections');
    const defaultCol = collections.body.find((c: { isDefault: boolean }) => c.isDefault);
    const res = await request(app).delete(`/api/collections/${defaultCol.id}`);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/review/queue', () => {
  it('returns queue with stats', async () => {
    const res = await request(app).get('/api/review/queue');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('queue');
    expect(res.body).toHaveProperty('stats');
  });
});

describe('POST /api/review', () => {
  it('saves a review and returns updated progress', async () => {
    const wordsRes = await request(app).get('/api/words');
    const word = wordsRes.body.words[0];
    const res = await request(app).post('/api/review').send({ wordId: word.id, rating: 2 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('repetitions');
    expect(res.body.repetitions).toBe(1);
  });

  it('returns 400 for invalid rating', async () => {
    const wordsRes = await request(app).get('/api/words');
    const word = wordsRes.body.words[0];
    const res = await request(app).post('/api/review').send({ wordId: word.id, rating: 9 });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/settings', () => {
  it('returns settings', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('frontSide');
    expect(res.body).toHaveProperty('newWordsPerDay');
  });
});

describe('PUT /api/settings', () => {
  it('updates settings', async () => {
    const res = await request(app).put('/api/settings').send({ newWordsPerDay: 30, frontSide: 'kanji' });
    expect(res.status).toBe(200);
    expect(res.body.newWordsPerDay).toBe(30);
    expect(res.body.frontSide).toBe('kanji');
  });
});

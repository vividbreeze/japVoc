import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';

import wordsRouter from './routes/words';
import collectionsRouter from './routes/collections';
import reviewRouter from './routes/review';
import statsRouter from './routes/stats';
import settingsRouter from './routes/settings';
import { seedIfEmpty } from '../prisma/seed';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/words', wordsRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/review', reviewRouter);
app.use('/api/stats', statsRouter);
app.use('/api/settings', settingsRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend in production
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Start server immediately, seed in background if DB is empty
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  seedIfEmpty().catch((e) => console.error('Seed error:', e));
});

export default app;

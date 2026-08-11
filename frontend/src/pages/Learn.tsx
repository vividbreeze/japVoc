import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchReviewQueue, submitReview } from '../api/client';
import { useSettingsStore } from '../store/useSettingsStore';
import FlashCard from '../components/FlashCard';
import type { Word, Rating } from '../types';

type Phase = 'loading' | 'session' | 'all-easy' | 'empty';

// How many cards to skip before re-showing based on rating
const REINSERT_DELAY: Record<number, number> = {
  0: 1,  // Nochmal → nach 1 Karte
  1: 3,  // Schwer  → nach 3 Karten
  2: 7,  // Gut     → nach 7 Karten
};

function insertAt<T>(arr: T[], item: T, pos: number): T[] {
  const clamped = Math.min(pos, arr.length);
  return [...arr.slice(0, clamped), item, ...arr.slice(clamped)];
}

export default function Learn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { settings } = useSettingsStore();

  const collectionId = searchParams.get('collectionId') ?? undefined;

  const [upcoming, setUpcoming] = useState<Word[]>([]);
  const [easyIds, setEasyIds] = useState<Set<string>>(new Set());
  const [totalCount, setTotalCount] = useState(0);
  const [phase, setPhase] = useState<Phase>('loading');
  const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });

  useEffect(() => {
    fetchReviewQueue(collectionId)
      .then(({ queue }) => {
        if (queue.length === 0) {
          setPhase('empty');
        } else {
          setUpcoming(queue);
          setTotalCount(queue.length);
          setPhase('session');
        }
      })
      .catch(() => setPhase('empty'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRate = useCallback(
    async (rating: Rating) => {
      const [current, ...rest] = upcoming;
      if (!current) return;

      const keys = ['again', 'hard', 'good', 'easy'] as const;
      setSessionStats((prev) => ({ ...prev, [keys[rating]]: prev[keys[rating]] + 1 }));

      // Fire-and-forget to backend for SM-2 stats — don't block UI
      submitReview(current.id, rating).catch(() => {});

      if (rating === 3) {
        // Easy: remove permanently from session
        const newEasyIds = new Set(easyIds);
        newEasyIds.add(current.id);
        setEasyIds(newEasyIds);
        if (rest.length === 0) {
          setUpcoming([]);
          setPhase('all-easy');
        } else {
          setUpcoming(rest);
        }
      } else {
        // Re-insert after a delay based on difficulty
        setUpcoming(insertAt(rest, current, REINSERT_DELAY[rating]));
      }
    },
    [upcoming, easyIds]
  );

  // ── Loading ──────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────
  if (phase === 'empty') {
    return (
      <div className="flex flex-col items-center gap-4 text-center max-w-sm mx-auto pt-12">
        <span className="text-5xl">📭</span>
        <h2 className="text-xl font-bold text-gray-800">Keine Vokabeln vorhanden</h2>
        <p className="text-gray-500 text-sm">Diese Sammlung enthält noch keine Vokabeln.</p>
        <button
          onClick={() => navigate('/collections')}
          className="border border-indigo-300 text-indigo-600 px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
        >
          ← Sammlungen
        </button>
      </div>
    );
  }

  // ── All easy ─────────────────────────────────────────────────────────────
  if (phase === 'all-easy') {
    const total = sessionStats.again + sessionStats.hard + sessionStats.good + sessionStats.easy;
    return (
      <div className="flex flex-col items-center gap-6 max-w-md mx-auto text-center">
        <span className="text-5xl">🌟</span>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Alle Karten gemeistert!</h2>
          <p className="text-gray-400 text-sm mt-1">Du hast alle {totalCount} Karten als „Leicht" bewertet.</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-full grid grid-cols-4 gap-2">
          {[
            { label: 'Nochmal', value: sessionStats.again, color: 'text-red-600' },
            { label: 'Schwer',  value: sessionStats.hard,  color: 'text-orange-500' },
            { label: 'Gut',     value: sessionStats.good,  color: 'text-green-600' },
            { label: 'Leicht',  value: sessionStats.easy,  color: 'text-blue-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400">{total} Bewertungen insgesamt</p>
        <div className="flex gap-3 w-full">
          <button
            onClick={() => navigate('/collections')}
            className="flex-1 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            ← Sammlungen
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Session ──────────────────────────────────────────────────────────────
  const current = upcoming[0];
  const easyCount = easyIds.size;
  const progressPct = totalCount > 0 ? (easyCount / totalCount) * 100 : 0;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Header */}
      <div className="w-full max-w-2xl px-4">
        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
          <button onClick={() => navigate('/collections')} className="hover:text-indigo-600 transition-colors">
            ← Abbrechen
          </button>
          <span className="text-indigo-600 font-semibold">
            {easyCount} / {totalCount} leicht ✓
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <FlashCard
        word={current}
        settings={settings}
        onRate={handleRate}
        cardIndex={0}
        total={upcoming.length}
      />
    </div>
  );
}

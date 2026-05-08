import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCollections, fetchReviewQueue, submitReview } from '../api/client';
import { useSettingsStore } from '../store/useSettingsStore';
import FlashCard from '../components/FlashCard';
import type { Collection, Word, Rating } from '../types';

type Phase = 'pick' | 'loading' | 'session' | 'done' | 'empty';

export default function Learn() {
  const navigate = useNavigate();
  const { settings } = useSettingsStore();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [queue, setQueue] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('pick');
  const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const [queueStats, setQueueStats] = useState({ due: 0, new: 0 });

  useEffect(() => {
    fetchCollections().then(setCollections);
  }, []);

  const startSession = useCallback((collectionId?: string) => {
    setSelectedId(collectionId);
    setPhase('loading');
    setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });
    fetchReviewQueue(collectionId)
      .then(({ queue, stats }) => {
        if (queue.length === 0) {
          setPhase('empty');
        } else {
          setQueue(queue);
          setCurrentIndex(0);
          setQueueStats({ due: stats.due, new: stats.new });
          setPhase('session');
        }
      })
      .catch(() => setPhase('empty'));
  }, []);

  const handleRate = useCallback(
    async (rating: Rating) => {
      const word = queue[currentIndex];
      if (!word) return;
      const keys = ['again', 'hard', 'good', 'easy'] as const;
      setSessionStats((prev) => ({ ...prev, [keys[rating]]: prev[keys[rating]] + 1 }));
      await submitReview(word.id, rating);
      if (currentIndex + 1 >= queue.length) {
        setPhase('done');
      } else {
        setCurrentIndex((i) => i + 1);
      }
    },
    [queue, currentIndex]
  );

  // ── Collection picker ────────────────────────────────────────────────────
  if (phase === 'pick') {
    return (
      <div className="space-y-5 max-w-lg">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Lernen</h1>
          <p className="text-sm text-gray-500">Wähle eine Sammlung zum Starten</p>
        </div>

        {collections.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {collections.map((c) => (
              <button
                key={c.id}
                onClick={() => startSession(c.isDefault ? undefined : c.id)}
                className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-indigo-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">
                        {c.name}
                      </span>
                      {c.isDefault && (
                        <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                          Standard
                        </span>
                      )}
                    </div>
                    {c.beschreibung && (
                      <p className="text-sm text-gray-500 mt-0.5">{c.beschreibung}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{c._count?.words ?? 0} Vokabeln</p>
                  </div>
                  <span className="text-indigo-400 group-hover:text-indigo-600 text-xl transition-colors">→</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

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
    const name = collections.find((c) => (c.isDefault ? !selectedId : c.id === selectedId))?.name ?? 'Gesamtwortschatz N5';
    return (
      <div className="flex flex-col items-center gap-4 text-center max-w-sm mx-auto pt-12">
        <span className="text-5xl">🎉</span>
        <h2 className="text-xl font-bold text-gray-800">Alle Karten erledigt!</h2>
        <p className="text-gray-500 text-sm">
          In <strong>{name}</strong> gibt es heute nichts mehr zu lernen.
        </p>
        <div className="flex gap-3 w-full">
          <button
            onClick={() => setPhase('pick')}
            className="flex-1 border border-indigo-300 text-indigo-600 px-4 py-2.5 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
          >
            ← Andere Sammlung
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

  // ── Done ─────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    const total = sessionStats.again + sessionStats.hard + sessionStats.good + sessionStats.easy;
    return (
      <div className="flex flex-col items-center gap-6 max-w-md mx-auto text-center">
        <span className="text-5xl">✅</span>
        <h2 className="text-2xl font-bold text-gray-800">Lerneinheit abgeschlossen!</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 w-full grid grid-cols-2 gap-3">
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
        <p className="text-gray-500 text-sm">{total} Karten bewertet</p>
        <div className="flex gap-3 w-full">
          <button
            onClick={() => setPhase('pick')}
            className="flex-1 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            ← Sammlungen
          </button>
          <button
            onClick={() => startSession(selectedId)}
            className="flex-1 border border-indigo-300 text-indigo-600 px-4 py-2.5 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
          >
            Nochmal
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
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Back link + queue info */}
      <div className="w-full max-w-2xl flex items-center justify-between px-4 text-sm text-gray-400">
        <button onClick={() => setPhase('pick')} className="hover:text-indigo-600 transition-colors">
          ← Sammlungen
        </button>
        <span>
          {queueStats.due > 0 && `${queueStats.due} fällig`}
          {queueStats.due > 0 && queueStats.new > 0 && ' · '}
          {queueStats.new > 0 && `${queueStats.new} neu`}
        </span>
      </div>

      <FlashCard
        word={queue[currentIndex]}
        settings={settings}
        onRate={handleRate}
        cardIndex={currentIndex}
        total={queue.length}
      />
    </div>
  );
}

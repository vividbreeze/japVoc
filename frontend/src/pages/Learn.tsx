import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchReviewQueue, submitReview } from '../api/client';
import { useSettingsStore } from '../store/useSettingsStore';
import FlashCard from '../components/FlashCard';
import type { Word, Rating } from '../types';

type Phase = 'loading' | 'session' | 'done' | 'empty';

export default function Learn() {
  const [searchParams] = useSearchParams();
  const collectionId = searchParams.get('collectionId') ?? undefined;
  const navigate = useNavigate();

  const { settings } = useSettingsStore();

  const [queue, setQueue] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('loading');
  const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });

  useEffect(() => {
    setPhase('loading');
    fetchReviewQueue(collectionId)
      .then(({ queue }) => {
        if (queue.length === 0) {
          setPhase('empty');
        } else {
          setQueue(queue);
          setCurrentIndex(0);
          setPhase('session');
        }
      })
      .catch(() => setPhase('empty'));
  }, [collectionId]);

  const handleRate = useCallback(
    async (rating: Rating) => {
      const word = queue[currentIndex];
      if (!word) return;

      // Update session stats
      setSessionStats((prev) => ({
        ...prev,
        [['again', 'hard', 'good', 'easy'][rating]]: prev[['again', 'hard', 'good', 'easy'][rating] as keyof typeof prev] + 1,
      }));

      await submitReview(word.id, rating);

      if (currentIndex + 1 >= queue.length) {
        setPhase('done');
      } else {
        setCurrentIndex((i) => i + 1);
      }
    },
    [queue, currentIndex]
  );

  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (phase === 'empty') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <span className="text-5xl">🎉</span>
        <h2 className="text-xl font-bold text-gray-800">Alle Karten für heute erledigt!</h2>
        <p className="text-gray-500">Komm morgen wieder für neue Wiederholungen.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          Zum Dashboard
        </button>
      </div>
    );
  }

  if (phase === 'done') {
    const total = sessionStats.again + sessionStats.hard + sessionStats.good + sessionStats.easy;
    return (
      <div className="flex flex-col items-center justify-center gap-6 max-w-md mx-auto text-center">
        <span className="text-5xl">✅</span>
        <h2 className="text-2xl font-bold text-gray-800">Lerneinheit abgeschlossen!</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 w-full grid grid-cols-2 gap-3">
          {[
            { label: 'Nochmal', value: sessionStats.again, color: 'text-red-600' },
            { label: 'Schwer', value: sessionStats.hard, color: 'text-orange-500' },
            { label: 'Gut', value: sessionStats.good, color: 'text-green-600' },
            { label: 'Leicht', value: sessionStats.easy, color: 'text-blue-600' },
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
            onClick={() => { setPhase('loading'); setCurrentIndex(0); fetchReviewQueue(collectionId).then(({ queue }) => { setQueue(queue); setCurrentIndex(0); setPhase(queue.length > 0 ? 'session' : 'empty'); }).catch(() => setPhase('empty')); }}
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

  return (
    <div className="flex flex-col items-center">
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

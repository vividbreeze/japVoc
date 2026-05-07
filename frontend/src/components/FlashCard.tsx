import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Word, Rating, Settings } from '../types';

interface FlashCardProps {
  word: Word;
  settings: Settings;
  onRate: (rating: Rating) => void;
  cardIndex: number;
  total: number;
}

const RATING_CONFIG: { rating: Rating; label: string; sublabel: string; color: string }[] = [
  { rating: 0, label: 'Nochmal', sublabel: 'Again', color: 'bg-red-500 hover:bg-red-600' },
  { rating: 1, label: 'Schwer', sublabel: 'Hard', color: 'bg-orange-400 hover:bg-orange-500' },
  { rating: 2, label: 'Gut', sublabel: 'Good', color: 'bg-green-500 hover:bg-green-600' },
  { rating: 3, label: 'Leicht', sublabel: 'Easy', color: 'bg-blue-500 hover:bg-blue-600' },
];

export default function FlashCard({ word, settings, onRate, cardIndex, total }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);

  // Reset flip state when word changes
  useEffect(() => {
    setFlipped(false);
  }, [word.id]);

  // Keyboard controls
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!flipped) setFlipped(true);
      }
      if (flipped) {
        if (e.key === '1') onRate(0);
        if (e.key === '2') onRate(1);
        if (e.key === '3') onRate(2);
        if (e.key === '4') onRate(3);
      }
    },
    [flipped, onRate]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto px-4">
      {/* Progress bar */}
      <div className="w-full">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>Karte {cardIndex + 1} von {total}</span>
          <span>{Math.round(((cardIndex) / total) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${(cardIndex / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        className="w-full cursor-pointer select-none"
        style={{ perspective: '1200px' }}
        onClick={() => !flipped && setFlipped(true)}
      >
        <AnimatePresence mode="wait" initial={false}>
          {!flipped ? (
            <motion.div
              key="front"
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 min-h-64 flex flex-col items-center justify-center p-8 gap-2"
            >
              <span className="text-xs font-medium text-indigo-400 uppercase tracking-widest">{word.wortart}</span>

              {settings.frontShowHiragana && (
                <p className="text-5xl font-japanese font-medium text-gray-800 text-center leading-tight">
                  {word.hiragana}
                </p>
              )}
              {settings.frontShowKanji && word.kanji && (
                <p className={`font-japanese font-medium text-gray-700 text-center ${settings.frontShowHiragana ? 'text-3xl' : 'text-5xl'}`}>
                  {word.kanji}
                </p>
              )}
              {settings.frontShowRomaji && word.romaji && (
                <p className="text-xl text-indigo-400 italic">{word.romaji}</p>
              )}
              {settings.frontShowExampleJp && word.beispielsatz_jp && (
                <p className="text-base font-japanese text-gray-600 text-center mt-1">{word.beispielsatz_jp}</p>
              )}
              {!settings.frontShowHiragana && !settings.frontShowKanji && !settings.frontShowRomaji && !settings.frontShowExampleJp && (
                <p className="text-gray-400 italic text-sm">Keine Vorderseite aktiviert</p>
              )}

              <p className="mt-4 text-sm text-gray-400">Leertaste oder klicken zum Umdrehen</p>
            </motion.div>
          ) : (
            <motion.div
              key="back"
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-indigo-50 rounded-2xl shadow-xl border border-indigo-100 min-h-64 flex flex-col items-center justify-center p-8 gap-3"
            >
              <span className="text-xs font-medium text-indigo-400 uppercase tracking-widest">{word.wortart}</span>

              {/* Deutsche Übersetzung – immer auf der Rückseite */}
              <p className="text-4xl font-bold text-indigo-700 text-center">{word.deutsch}</p>

              {/* Hiragana auf Rückseite, wenn aktiviert und nicht schon vorne */}
              {settings.showHiragana && !settings.frontShowHiragana && (
                <p className="text-2xl font-japanese text-gray-600">{word.hiragana}</p>
              )}
              {/* Kanji auf Rückseite, wenn aktiviert und nicht schon vorne */}
              {settings.showKanji && word.kanji && !settings.frontShowKanji && (
                <p className="text-2xl font-japanese text-gray-500">{word.kanji}</p>
              )}

              {settings.showExampleSentence && word.beispielsatz_jp && (
                <div className="mt-4 w-full bg-white rounded-xl p-4 border border-indigo-100">
                  <p className="text-base font-japanese text-gray-700 mb-1">{word.beispielsatz_jp}</p>
                  <p className="text-sm text-gray-500 italic">{word.beispielsatz_de}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rating buttons – only visible after flip */}
      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-4 gap-3 w-full"
          >
            {RATING_CONFIG.map(({ rating, label, sublabel, color }) => (
              <button
                key={rating}
                onClick={() => onRate(rating)}
                className={`${color} text-white rounded-xl py-3 px-2 flex flex-col items-center gap-0.5 transition-all active:scale-95 shadow-md`}
              >
                <span className="font-semibold text-sm">{label}</span>
                <span className="text-xs opacity-80">{sublabel} [{rating + 1}]</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-xs text-gray-400">
        {flipped ? '1–4 zur Bewertung' : 'Leertaste zum Umdrehen'}
      </p>
    </div>
  );
}

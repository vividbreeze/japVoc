import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SpeakButton from './SpeakButton';
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
  { rating: 1, label: 'Schwer',  sublabel: 'Hard',  color: 'bg-orange-400 hover:bg-orange-500' },
  { rating: 2, label: 'Gut',     sublabel: 'Good',  color: 'bg-green-500 hover:bg-green-600' },
  { rating: 3, label: 'Leicht',  sublabel: 'Easy',  color: 'bg-blue-500 hover:bg-blue-600' },
];

// ─── Japanese side ────────────────────────────────────────────────────────────
function JapaneseSide({ word, settings, dim = false, showExample = false }: { word: Word; settings: Settings; dim?: boolean; showExample?: boolean }) {
  const hasContent = settings.frontShowHiragana || settings.frontShowKanji || settings.frontShowRomaji;
  const speakText = word.kanji || word.hiragana;
  return (
    <div className="flex flex-col items-center gap-2 w-full">
      {settings.frontShowHiragana && (
        <div className="flex items-center gap-2">
          <p className={`font-japanese font-medium text-center leading-tight ${dim ? 'text-3xl text-gray-600' : 'text-5xl text-gray-800'}`}>
            {word.hiragana}
          </p>
          <SpeakButton text={speakText} />
        </div>
      )}
      {settings.frontShowKanji && word.kanji && (
        <div className="flex items-center gap-2">
          <p className={`font-japanese font-medium text-center ${dim ? 'text-2xl text-indigo-500' : settings.frontShowHiragana ? 'text-3xl text-indigo-600' : 'text-5xl text-gray-800'}`}>
            {word.kanji}
          </p>
          {!settings.frontShowHiragana && <SpeakButton text={speakText} />}
        </div>
      )}
      {settings.frontShowRomaji && word.romaji && (
        <p className={`italic ${dim ? 'text-base text-indigo-300' : 'text-xl text-indigo-400'}`}>
          {word.romaji}
        </p>
      )}
      {!hasContent && (
        <p className="text-gray-400 italic text-sm">Keine japanische Anzeige aktiviert</p>
      )}
      {showExample && word.beispielsatz_jp && (
        <div className="mt-2 w-full bg-white rounded-xl p-3 border border-gray-100">
          <div className="flex items-center justify-center gap-2">
            <p className="text-sm font-japanese text-gray-600 text-center">{word.beispielsatz_jp}</p>
            <SpeakButton text={word.beispielsatz_jp} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── German side ─────────────────────────────────────────────────────────────
function GermanSide({ word, dim = false }: { word: Word; dim?: boolean }) {
  return (
    <p className={`font-bold text-center ${dim ? 'text-3xl text-indigo-500' : 'text-5xl text-indigo-700'}`}>
      {word.deutsch}
    </p>
  );
}

// ─── Example sentence block (back side) ──────────────────────────────────────
function ExampleBlock({ word }: { word: Word }) {
  if (!word.beispielsatz_jp && !word.beispielsatz_de) return null;
  return (
    <div className="mt-3 w-full bg-white rounded-xl p-4 border border-indigo-100">
      {word.beispielsatz_jp && (
        <div className="flex items-start gap-2 mb-1">
          <p className="text-base font-japanese text-gray-700 flex-1">{word.beispielsatz_jp}</p>
          <SpeakButton text={word.beispielsatz_jp} className="mt-0.5 shrink-0" />
        </div>
      )}
      {word.beispielsatz_de && (
        <p className="text-sm text-gray-500 italic">{word.beispielsatz_de}</p>
      )}
    </div>
  );
}

// ─── FlashCard ────────────────────────────────────────────────────────────────
export default function FlashCard({ word, settings, onRate, cardIndex, total }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);
  const jpFirst = settings.lernrichtung === 'jp_to_de';

  useEffect(() => { setFlipped(false); }, [word.id]);

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
          <span>{Math.round((cardIndex / total) * 100)}%</span>
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
            // ── FRONT ──────────────────────────────────────────────
            <motion.div
              key="front"
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 min-h-64 flex flex-col items-center justify-center p-8 gap-3"
            >
              <span className="text-xs font-medium text-indigo-400 uppercase tracking-widest">
                {word.wortart}
              </span>

              {jpFirst ? (
                <JapaneseSide word={word} settings={settings} showExample={settings.frontShowExampleJp} />
              ) : (
                <>
                  <GermanSide word={word} />
                  {settings.showExampleSentence && word.beispielsatz_de && (
                    <div className="mt-2 w-full bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-sm text-gray-500 italic text-center">{word.beispielsatz_de}</p>
                    </div>
                  )}
                </>
              )}

              <p className="mt-4 text-sm text-gray-400">Leertaste oder klicken zum Umdrehen</p>
            </motion.div>
          ) : (
            // ── BACK ───────────────────────────────────────────────
            <motion.div
              key="back"
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-indigo-50 rounded-2xl shadow-xl border border-indigo-100 min-h-64 flex flex-col items-center justify-center p-8 gap-2"
            >
              <span className="text-xs font-medium text-indigo-400 uppercase tracking-widest">
                {word.wortart}
              </span>

              {/* Hint: what was on the front, shown smaller */}
              {jpFirst ? (
                <JapaneseSide word={word} settings={settings} dim />
              ) : (
                <GermanSide word={word} dim />
              )}

              <div className="w-full border-t border-indigo-100 my-1" />

              {/* Main reveal */}
              {jpFirst ? (
                <GermanSide word={word} />
              ) : (
                <JapaneseSide word={word} settings={settings} showExample={settings.frontShowExampleJp} />
              )}

              {/* Example sentence */}
              {settings.showExampleSentence && <ExampleBlock word={word} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rating buttons */}
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

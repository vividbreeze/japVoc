import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '../store/useSettingsStore';
import type { Settings } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsOverlay({ isOpen, onClose }: Props) {
  const { settings, update } = useSettingsStore();
  const jpToDE = settings.lernrichtung === 'jp_to_de';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 text-lg">Einstellungen</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                aria-label="Schließen"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

              {/* Lernrichtung */}
              <Section title="Lernrichtung">
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <DirectionBtn
                    active={jpToDE}
                    onClick={() => update({ lernrichtung: 'jp_to_de' })}
                    label="日本語 → Deutsch"
                  />
                  <DirectionBtn
                    active={!jpToDE}
                    onClick={() => update({ lernrichtung: 'de_to_jp' })}
                    label="Deutsch → 日本語"
                  />
                </div>
              </Section>

              {/* Japanische Seite */}
              <Section title={jpToDE ? 'Vorderseite – Japanisch' : 'Rückseite – Japanisch'}>
                <div className="space-y-3 mt-2">
                  <ToggleRow
                    label="Hiragana / Katakana"
                    checked={settings.frontShowHiragana}
                    onChange={(v) => update({ frontShowHiragana: v })}
                  />
                  <ToggleRow
                    label="Kanji"
                    checked={settings.frontShowKanji}
                    onChange={(v) => update({ frontShowKanji: v })}
                  />
                  <ToggleRow
                    label="Romaji"
                    checked={settings.frontShowRomaji}
                    onChange={(v) => update({ frontShowRomaji: v })}
                  />
                  <ToggleRow
                    label="Beispielsatz (Japanisch)"
                    checked={settings.frontShowExampleJp}
                    onChange={(v) => update({ frontShowExampleJp: v })}
                  />
                  {!anyJapaneseEnabled(settings) && (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      Mindestens eine Option sollte aktiviert sein.
                    </p>
                  )}
                </div>
              </Section>

              {/* Deutsche Seite */}
              <Section title={jpToDE ? 'Rückseite – Deutsch' : 'Vorderseite – Deutsch'}>
                <div className="mt-2">
                  <ToggleRow
                    label="Beispielsatz anzeigen"
                    checked={settings.showExampleSentence}
                    onChange={(v) => update({ showExampleSentence: v })}
                  />
                </div>
              </Section>

              {/* Neue Vokabeln */}
              <Section title="Neue Vokabeln pro Sitzung">
                <div className="space-y-3 mt-2">
                  <ToggleRow
                    label="Alle verfügbaren Vokabeln"
                    checked={settings.newWordsPerDay === 0}
                    onChange={(v) => update({ newWordsPerDay: v ? 0 : 20 })}
                  />
                  {settings.newWordsPerDay !== 0 && (
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={5}
                        max={200}
                        step={5}
                        value={settings.newWordsPerDay}
                        onChange={(e) => update({ newWordsPerDay: Number(e.target.value) })}
                        className="flex-1 accent-indigo-600"
                      />
                      <span className="w-14 text-center font-semibold text-indigo-700 text-sm">
                        {settings.newWordsPerDay} / Tag
                      </span>
                    </div>
                  )}
                </div>
              </Section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function anyJapaneseEnabled(s: Settings) {
  return s.frontShowHiragana || s.frontShowKanji || s.frontShowRomaji;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="font-semibold text-gray-700 text-sm mb-1">{title}</p>
      {children}
    </div>
  );
}

function DirectionBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border-2 py-2 px-3 text-xs font-medium font-japanese transition-all ${
        active ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
          checked ? 'bg-indigo-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

import { useEffect } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import type { Settings } from '../types';

export default function Settings() {
  const { settings, loaded, load, update } = useSettingsStore();

  useEffect(() => { if (!loaded) load(); }, [loaded, load]);

  const jpToDE = settings.lernrichtung === 'jp_to_de';

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Einstellungen</h1>
        <p className="text-sm text-gray-500">Lernmodus anpassen</p>
      </div>

      {/* ── Lernrichtung ─────────────────────────────────────────── */}
      <Section title="Lernrichtung" description="Welche Seite der Karte zuerst angezeigt wird">
        <div className="grid grid-cols-2 gap-3 mt-3">
          <DirectionCard
            active={jpToDE}
            onClick={() => update({ lernrichtung: 'jp_to_de' })}
            front="日本語"
            frontSub="Japanisch"
            back="Deutsch"
          />
          <DirectionCard
            active={!jpToDE}
            onClick={() => update({ lernrichtung: 'de_to_jp' })}
            front="Deutsch"
            back="日本語"
            backSub="Japanisch"
          />
        </div>
      </Section>

      {/* ── Vorderseite ──────────────────────────────────────────── */}
      <Section
        title={jpToDE ? 'Vorderseite – Japanisch' : 'Rückseite – Japanisch'}
        description={
          jpToDE
            ? 'Was auf der japanischen Vorderseite angezeigt wird'
            : 'Was auf der japanischen Rückseite angezeigt wird'
        }
      >
        <div className="space-y-3 mt-3">
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

      {/* ── Rückseite ────────────────────────────────────────────── */}
      <Section
        title={jpToDE ? 'Rückseite – Deutsch' : 'Vorderseite – Deutsch'}
        description="Die deutsche Übersetzung wird immer angezeigt"
      >
        <div className="mt-3">
          <ToggleRow
            label="Beispielsatz anzeigen"
            checked={settings.showExampleSentence}
            onChange={(v) => update({ showExampleSentence: v })}
          />
        </div>
      </Section>

      {/* ── Lernziel ─────────────────────────────────────────────── */}
      <Section title="Neue Vokabeln pro Sitzung" description="Wie viele neue Wörter pro Lernsitzung angezeigt werden">
        <div className="space-y-3 mt-3">
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
              <span className="w-16 text-center font-semibold text-indigo-700 text-sm">
                {settings.newWordsPerDay} / Tag
              </span>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

function anyJapaneseEnabled(s: Settings) {
  return s.frontShowHiragana || s.frontShowKanji || s.frontShowRomaji;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-1">
      <p className="font-semibold text-gray-800">{title}</p>
      <p className="text-xs text-gray-400">{description}</p>
      {children}
    </div>
  );
}

function DirectionCard({
  active, onClick, front, frontSub, back, backSub,
}: {
  active: boolean;
  onClick: () => void;
  front: string;
  frontSub?: string;
  back: string;
  backSub?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border-2 p-4 text-center transition-all ${
        active
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
    >
      <div className="flex items-center justify-center gap-2 text-sm">
        <span className={`font-bold font-japanese text-lg ${active ? 'text-indigo-700' : 'text-gray-700'}`}>
          {front}
        </span>
        <span className="text-gray-400">→</span>
        <span className={`font-medium ${active ? 'text-indigo-500' : 'text-gray-500'}`}>
          {back}
        </span>
      </div>
      {(frontSub || backSub) && (
        <p className="text-xs text-gray-400 mt-1">
          {frontSub ?? front} → {backSub ?? back}
        </p>
      )}
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

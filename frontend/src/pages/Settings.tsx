import { useEffect } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import type { Settings } from '../types';

export default function Settings() {
  const { settings, loaded, load, update } = useSettingsStore();

  useEffect(() => { if (!loaded) load(); }, [loaded, load]);

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Einstellungen</h1>
        <p className="text-sm text-gray-500">Lernmodus anpassen</p>
      </div>

      {/* ── Vorderseite ─────────────────────────────────────────── */}
      <Section title="Vorderseite der Karte" description="Was auf der Vorderseite der Karteikarte angezeigt wird">
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
          {!anyFrontEnabled(settings) && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Mindestens eine Option sollte aktiviert sein – sonst bleibt die Vorderseite leer.
            </p>
          )}
        </div>
      </Section>

      {/* ── Rückseite ────────────────────────────────────────────── */}
      <Section title="Rückseite der Karte" description="Was zusätzlich zur deutschen Übersetzung angezeigt wird">
        <div className="space-y-3 mt-3">
          <ToggleRow
            label="Hiragana / Katakana"
            checked={settings.showHiragana}
            onChange={(v) => update({ showHiragana: v })}
          />
          <ToggleRow
            label="Kanji"
            checked={settings.showKanji}
            onChange={(v) => update({ showKanji: v })}
          />
          <ToggleRow
            label="Beispielsatz (Japanisch + Deutsch)"
            checked={settings.showExampleSentence}
            onChange={(v) => update({ showExampleSentence: v })}
          />
        </div>
      </Section>

      {/* ── Lernmodus ────────────────────────────────────────────── */}
      <Section title="Lernmodus" description="Tägliches Lernziel">
        <div className="flex items-center gap-3 mt-3">
          <input
            type="range"
            min={5}
            max={100}
            step={5}
            value={settings.newWordsPerDay}
            onChange={(e) => update({ newWordsPerDay: Number(e.target.value) })}
            className="flex-1 accent-indigo-600"
          />
          <span className="w-16 text-center font-semibold text-indigo-700 text-sm">
            {settings.newWordsPerDay} / Tag
          </span>
        </div>
      </Section>
    </div>
  );
}

function anyFrontEnabled(s: Settings) {
  return s.frontShowHiragana || s.frontShowKanji || s.frontShowRomaji || s.frontShowExampleJp;
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-1">
      <p className="font-semibold text-gray-800">{title}</p>
      <p className="text-xs text-gray-400">{description}</p>
      {children}
    </div>
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
